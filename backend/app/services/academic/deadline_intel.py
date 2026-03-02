from datetime import datetime, timedelta
from fastapi import HTTPException
from sqlmodel import Session, select

from app.models.academic import Assignment, AssignmentWorkPlan, Course


def detect_conflicts(session: Session, window_hours: int, only_upcoming: bool = True) -> dict:
    window = timedelta(hours=window_hours)

    # Pull assignments
    items = session.exec(select(Assignment)).all()

    # Remove assignments with missing due_at
    items = [a for a in items if a.due_at is not None]

    # Optional: only future deadlines (recommended for UI)
    if only_upcoming:
        now = datetime.utcnow()
        items = [a for a in items if a.due_at >= now]

    # Sort
    items.sort(key=lambda a: a.due_at)

    # Map course_id -> course info (for readable output)
    courses = session.exec(select(Course)).all()
    course_map = {c.id: {"code": c.code, "name": c.name} for c in courses}

    conflicts = []

    for i in range(len(items)):
        a1 = items[i]

        for j in range(i + 1, len(items)):
            a2 = items[j]

            dt = a2.due_at - a1.due_at
            if dt > window:
                break

            # only conflicts across different courses
            if a1.course_id != a2.course_id:
                c1 = course_map.get(a1.course_id, {"code": None, "name": None})
                c2 = course_map.get(a2.course_id, {"code": None, "name": None})

                conflicts.append({
                    "a1": {
                        "id": a1.id,
                        "course_code": c1["code"],
                        "course_name": c1["name"],
                        "title": a1.title,
                        "due_at": a1.due_at.isoformat(),
                    },
                    "a2": {
                        "id": a2.id,
                        "course_code": c2["code"],
                        "course_name": c2["name"],
                        "title": a2.title,
                        "due_at": a2.due_at.isoformat(),
                    },
                    "delta_hours": round(dt.total_seconds() / 3600.0, 2),
                })

    return {"window_hours": window_hours, "count": len(conflicts), "conflicts": conflicts}

def suggest_start_date(session: Session, assignment_id: int, planned_hours: float, difficulty: str):
    """
    Purpose:
    Compute a recommended start datetime for an assignment using:
    - due_at
    - planned_hours
    - difficulty multiplier
    """

    a = session.exec(select(Assignment).where(Assignment.id == assignment_id)).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")

    difficulty_factor = {"easy": 1.0, "medium": 1.3, "hard": 1.7}.get(difficulty, 1.3)

    # Convert hours into "calendar buffer"
    # hackathon-friendly: assume student can do 2 focused hours/day on this assignment
    effective_hours = planned_hours * difficulty_factor
    days_needed = max(1, int((effective_hours + 1.99) // 2))  # ceil(hours/2)

    suggested_start_at = a.due_at - timedelta(days=days_needed)

    rationale = (
        f"Due on {a.due_at.date()}. With {planned_hours}h planned and '{difficulty}' difficulty, "
        f"we recommend starting {days_needed} day(s) before due date."
    )

    return {"suggested_start_at": suggested_start_at, "rationale": rationale}

def upsert_work_plan(
    session: Session,
    assignment_id: int,
    suggested_start_at: datetime,
    planned_hours: float,
    difficulty: str,
    rationale: str,
):
    """
    Purpose:
    Save (or update) the work plan for an assignment so the frontend can fetch it later.
    """
    wp = session.exec(
        select(AssignmentWorkPlan).where(AssignmentWorkPlan.assignment_id == assignment_id)
    ).first()

    if wp:
        wp.suggested_start_at = suggested_start_at
        wp.planned_hours = planned_hours
        wp.difficulty = difficulty
        wp.rationale = rationale
    else:
        wp = AssignmentWorkPlan(
            assignment_id=assignment_id,
            suggested_start_at=suggested_start_at,
            planned_hours=planned_hours,
            difficulty=difficulty,
            rationale=rationale,
        )
        session.add(wp)

    session.commit()
    session.refresh(wp)
    return wp