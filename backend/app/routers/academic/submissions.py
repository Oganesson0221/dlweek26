from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.academic import Assignment, Reminder, AssignmentWorkPlan
from app.schemas.academic import AssignmentCreate, AssignmentStatusUpdate
from app.services.academic.submission_service import create_assignment, list_assignments, update_status
from app.services.academic.reminder_service import schedule_default_reminders

router = APIRouter(prefix="/academic/submissions", tags=["academic-submissions"])

@router.post("/courses/{course_id}/assignments")
def assignment_create(course_id: int, body: AssignmentCreate, session: Session = Depends(get_session)):
    a = create_assignment(session, course_id, body.title, body.description, body.due_at, body.weight)
    schedule_default_reminders(session, a.id)
    return a

@router.get("/courses/{course_id}/assignments")
def assignment_list(course_id: int, session: Session = Depends(get_session)):
    return list_assignments(session, course_id)

@router.patch("/assignments/{assignment_id}/status")
def assignment_status(assignment_id: int, body: AssignmentStatusUpdate, session: Session = Depends(get_session)):
    return update_status(session, assignment_id, body.status)

@router.get("/assignments/{assignment_id}/reminders")
def assignment_reminders(assignment_id: int, session: Session = Depends(get_session)):
    return session.exec(select(Reminder).where(Reminder.assignment_id == assignment_id)).all()

@router.get("/assignments/{assignment_id}/workplan")
def assignment_workplan(assignment_id: int, session: Session = Depends(get_session)):
    return session.exec(select(AssignmentWorkPlan).where(AssignmentWorkPlan.assignment_id == assignment_id)).first()