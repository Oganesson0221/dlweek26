from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.academic import Course
from app.schemas.academic import DraftHookRequest, SuggestionHookRequest
from app.services.academic.copilot_hooks import draft_hook, suggestion_hook

router = APIRouter(prefix="/academic/copilot", tags=["academic-copilot-hooks"])


def get_course_or_404(session: Session, course_code: str):
    course = session.exec(select(Course).where(Course.code == course_code)).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


# Draft content for an assignment
@router.post("/draft_assignment")
def draft_assignment(body: DraftHookRequest, session: Session = Depends(get_session)):
    return draft_hook(session, body.assignment_id, body.prompt)


# Suggest assignments for a course
@router.post("/assignment_suggestions/{course_code}")
def assignment_suggestions(course_code: str, body: SuggestionHookRequest, session: Session = Depends(get_session)):
    course = get_course_or_404(session, course_code)
    return suggestion_hook(session, course.id, body.prompt)