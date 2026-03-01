from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.academic import Assignment, Reminder, AssignmentWorkPlan, Course
from app.schemas.academic import AssignmentCreate, AssignmentStatusUpdate
from app.services.academic.submission_service import create_assignment, list_assignments, update_status
from app.services.academic.reminder_service import schedule_default_reminders
from fastapi import HTTPException

router = APIRouter(prefix="/academic/submissions", tags=["academic-submissions"])


def get_course_or_404(session: Session, course_code: str):
    course = session.exec(select(Course).where(Course.code == course_code)).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


# Create assignment
@router.post("/courses/{course_code}/assignments")
def assignment_create(course_code: str, body: AssignmentCreate, session: Session = Depends(get_session)):
    course = get_course_or_404(session, course_code)
    a = create_assignment(session, course.id, body.title, body.description, body.due_at, body.weight)
    schedule_default_reminders(session, a.id)
    return a


# List assignments
@router.get("/courses/{course_code}/assignments")
def assignment_list(course_code: str, session: Session = Depends(get_session)):
    course = get_course_or_404(session, course_code)
    return list_assignments(session, course.id)


# Update status
@router.patch("/assignments/{assignment_id}/status")
def assignment_status(assignment_id: int, body: AssignmentStatusUpdate, session: Session = Depends(get_session)):
    return update_status(session, assignment_id, body.status)


# View reminders
@router.get("/assignments/{assignment_id}/reminders")
def assignment_reminders(assignment_id: int, session: Session = Depends(get_session)):
    return session.exec(select(Reminder).where(Reminder.assignment_id == assignment_id)).all()


# View workplan
@router.get("/assignments/{assignment_id}/workplan")
def assignment_workplan(assignment_id: int, session: Session = Depends(get_session)):
    return session.exec(select(AssignmentWorkPlan).where(AssignmentWorkPlan.assignment_id == assignment_id)).first()