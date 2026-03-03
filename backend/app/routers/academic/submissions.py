from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db.session import get_session
from app.models.academic import Course, Assignment, Reminder, AssignmentWorkPlan
from app.schemas.academic import AssignmentCreate, AssignmentStatusUpdate
from app.services.academic.submission_service import create_assignment, list_assignments, update_status
from app.services.academic.reminder_service import schedule_default_reminders

router = APIRouter(tags=["academic-submissions"])


def get_course_or_404(session: Session, course_code: str) -> Course:
    course = session.exec(select(Course).where(Course.code == course_code)).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


def get_assignment_or_404(session: Session, assignment_id: int) -> Assignment:
    a = session.exec(select(Assignment).where(Assignment.id == assignment_id)).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return a


@router.post("/courses/{course_code}/assignments")
def assignment_create(course_code: str, body: AssignmentCreate, session: Session = Depends(get_session)):
    course = session.exec(select(Course).where(Course.code == course_code)).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    a = create_assignment(session, course.id, body.title, body.description, body.due_at, body.weight)

    created = schedule_default_reminders(session, a.id)

    return {
        "course_code": course_code,
        "assignment": {
            "id": a.id,
            "title": a.title,
            "due_at": a.due_at,
            "weight": a.weight,
            "status": a.status
        },
        "reminders_created": len(created),
        "reminders": [r.model_dump() for r in created],
    }

@router.get("/courses/{course_code}/assignments")
def assignment_list(course_code: str, session: Session = Depends(get_session)):
    """
    List assignments for a course.
    """
    course = get_course_or_404(session, course_code)
    items = list_assignments(session, course.id)
    return {"course_code": course.code, "assignments": items}


@router.patch("/assignments/{assignment_id}/status")
def assignment_status(assignment_id: int, body: AssignmentStatusUpdate, session: Session = Depends(get_session)):
    """
    Update assignment status: not_started | in_progress | submitted
    """
    updated = update_status(session, assignment_id, body.status)
    a = get_assignment_or_404(session, assignment_id)
    course = session.exec(select(Course).where(Course.id == a.course_id)).first()

    return {
        "course_code": course.code if course else None,
        "assignment_id": assignment_id,
        "status": updated.status if hasattr(updated, "status") else body.status,
        "assignment": updated
    }


@router.get("/assignments/{assignment_id}/reminders")
def assignment_reminders(assignment_id: int, session: Session = Depends(get_session)):
    """
    Get reminders for an assignment (for UI display).
    """
    a = get_assignment_or_404(session, assignment_id)
    course = session.exec(select(Course).where(Course.id == a.course_id)).first()

    reminders = session.exec(select(Reminder).where(Reminder.assignment_id == assignment_id)).all()
    return {"course_code": course.code if course else None, "assignment_id": assignment_id, "reminders": reminders}


@router.get("/assignments/{assignment_id}/workplan")
def assignment_workplan(assignment_id: int, session: Session = Depends(get_session)):
    """
    Purpose:
    Fetch the saved WorkPlan for the assignment.
    Used by frontend to display "start date suggestion" without recomputing.
    """
    wp = session.exec(
        select(AssignmentWorkPlan).where(AssignmentWorkPlan.assignment_id == assignment_id)
    ).first()

    if not wp:
        return {"assignment_id": assignment_id, "workplan": None}

    return {"assignment_id": assignment_id, "workplan": wp.model_dump()}