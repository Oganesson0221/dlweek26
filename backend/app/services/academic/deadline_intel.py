from datetime import timedelta
from sqlmodel import Session, select
from ...models.academic import Assignment, AssignmentWorkPlan


def detect_conflicts(session: Session, window_hours: int) -> dict:
    window = timedelta(hours=window_hours)
    items = session.exec(select(Assignment)).all()
    items.sort(key=lambda a: a.due_at)

    conflicts = []
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            dt = items[j].due_at - items[i].due_at
            if dt > window:
                break
            if items[i].course_id != items[j].course_id:
                conflicts.append({
                    "a1": {"id": items[i].id, "title": items[i].title, "due_at": items[i].due_at.isoformat()},
                    "a2": {"id": items[j].id, "title": items[j].title, "due_at": items[j].due_at.isoformat()},
                    "delta_hours": round(dt.total_seconds() / 3600.0, 2),
                })

    return {"window_hours": window_hours, "conflicts": conflicts}


def suggest_start_date(session: Session, assignment_id: int, planned_hours: float, difficulty: str) -> dict:
    a = session.exec(select(Assignment).where(Assignment.id == assignment_id)).first()
    if a is None:
        raise ValueError("assignment_not_found")

    base_days = {"easy": 3, "medium": 5, "hard": 8}.get(difficulty, 5)
    extra_days = max(int(planned_hours // 2) - 1, 0)  # ~2h/day heuristic
    suggested = a.due_at - timedelta(days=(base_days + extra_days))

    # cluster avoidance: if >=2 deadlines within 2 days of suggested start window, move earlier
    cluster_window = timedelta(days=2)
    all_asg = session.exec(select(Assignment)).all()
    cluster_count = 0
    for other in all_asg:
        if other.id == a.id:
            continue
        if abs((other.due_at - suggested).total_seconds()) <= cluster_window.total_seconds():
            cluster_count += 1

    if cluster_count >= 2:
        suggested -= timedelta(days=2)

    rationale = (
        f"Difficulty '{difficulty}' => {base_days} day lead. "
        f"Planned {planned_hours}h => +{extra_days} day(s). "
        f"Nearby deadlines around start window: {cluster_count}."
    )

    return {"assignment_id": assignment_id, "suggested_start_at": suggested, "rationale": rationale}


def upsert_work_plan(session: Session, assignment_id: int, suggested_start_at, planned_hours: float, difficulty: str, rationale: str):
    wp = session.exec(select(AssignmentWorkPlan).where(AssignmentWorkPlan.assignment_id == assignment_id)).first()
    if wp is None:
        wp = AssignmentWorkPlan(
            assignment_id=assignment_id,
            suggested_start_at=suggested_start_at,
            planned_hours=planned_hours,
            difficulty=difficulty,
            rationale=rationale,
        )
        session.add(wp)
    else:
        wp.suggested_start_at = suggested_start_at
        wp.planned_hours = planned_hours
        wp.difficulty = difficulty
        wp.rationale = rationale

    session.commit()
    session.refresh(wp)
    return wp