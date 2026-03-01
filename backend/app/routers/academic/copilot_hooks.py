from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.db.session import get_session
from app.schemas.academic import DraftHookRequest, SuggestionHookRequest
from app.services.academic.copilot_hooks import draft_hook, suggestion_hook

router = APIRouter(prefix="/academic/copilot", tags=["academic-copilot-hooks"])

@router.post("/draft_assignment")
def draft_assignment(body: DraftHookRequest, session: Session = Depends(get_session)):
    return draft_hook(session, body.assignment_id, body.prompt)

@router.post("/assignment_suggestions")
def assignment_suggestions(body: SuggestionHookRequest, session: Session = Depends(get_session)):
    return suggestion_hook(session, body.course_id, body.prompt)