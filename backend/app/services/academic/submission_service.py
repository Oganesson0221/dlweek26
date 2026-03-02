from sqlmodel import Session, select
from app.models.academic import Assignment
from datetime import datetime
from fastapi import HTTPException

VALID_STATUSES = {"not_started", "in_progress", "submitted"}



def create_assignment(session: Session, course_id: int, title: str, description: str, due_at: datetime, weight: float):
    a = Assignment(
        course_id=course_id,
        title=title,
        description=description,
        due_at=due_at,
        weight=weight,
        status="not_started",
    )
    session.add(a)
    session.commit()
    session.refresh(a)
    return a


def list_assignments(session: Session, course_id: int) -> list[Assignment]:
    return session.exec(select(Assignment).where(Assignment.course_id == course_id)).all()


def update_status(session: Session, assignment_id: int, status: str):
    allowed = ["not_started", "in_progress", "submitted"]

    if status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Allowed: {allowed}"
        )

    assignment = session.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment.status = status
    session.add(assignment)
    session.commit()
    session.refresh(assignment)

    return assignment