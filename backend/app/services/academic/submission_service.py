from sqlmodel import Session, select
from ...models.academic import Assignment


VALID_STATUSES = {"not_started", "in_progress", "submitted"}


def create_assignment(session: Session, course_id: int, title: str, description: str, due_at, weight: float) -> Assignment:
    a = Assignment(course_id=course_id, title=title, description=description, due_at=due_at, weight=weight)
    session.add(a)
    session.commit()
    session.refresh(a)
    return a


def list_assignments(session: Session, course_id: int) -> list[Assignment]:
    return session.exec(select(Assignment).where(Assignment.course_id == course_id)).all()


def update_status(session: Session, assignment_id: int, status: str) -> Assignment:
    if status not in VALID_STATUSES:
        raise ValueError("invalid_status")

    a = session.exec(select(Assignment).where(Assignment.id == assignment_id)).first()
    if a is None:
        raise ValueError("assignment_not_found")

    a.status = status
    session.commit()
    session.refresh(a)
    return a