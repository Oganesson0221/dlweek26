from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.academic import Course, Assignment
from app.schemas.academic import ConflictQuery, StartDateSuggestRequest
from app.services.academic.deadline_intel import detect_conflicts, suggest_start_date, upsert_work_plan
from app.services.academic.reminder_service import due_reminders, mark_sent

router = APIRouter(tags=["academic-deadlines"])



def get_course_or_404(session: Session, course_code: str):
    course = session.exec(select(Course).where(Course.code == course_code)).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.get("/ping")
def ping():
    return {"ok": True, "router": "academic-deadlines"}


# 1) Conflict detection (across all courses)
@router.post("/conflicts")
def conflicts(body: ConflictQuery, session: Session = Depends(get_session)):
    """
    Purpose:
    Detect assignments across different courses that are due within window_hours.
    Used for: conflict alerts on homepage + map.
    """
    return detect_conflicts(session, body.window_hours)


# 2) Suggest start date (stores WorkPlan)
@router.post("/suggest_start")
def suggest_start(body: StartDateSuggestRequest, session: Session = Depends(get_session)):
    """
    Purpose:
    Suggest when student should start the assignment.
    Saves suggestion into AssignmentWorkPlan for later retrieval.
    Used for: Copilot 'When should I start?' and map route planning.
    """
    s = suggest_start_date(session, body.assignment_id, body.planned_hours, body.difficulty)

    wp = upsert_work_plan(
        session=session,
        assignment_id=body.assignment_id,
        suggested_start_at=s["suggested_start_at"],
        planned_hours=body.planned_hours,
        difficulty=body.difficulty,
        rationale=s["rationale"],
    )

    return {
        "assignment_id": body.assignment_id,
        "suggestion": {
            "suggested_start_at": s["suggested_start_at"],
            "rationale": s["rationale"],
        },
        "workplan": wp.model_dump(),
    }


# 3) Reminder engine
@router.get("/reminders/due")
def reminders_due(session: Session = Depends(get_session)):
    """
    Purpose:
    Returns reminders due as of now.
    Used for: background scheduler later, or frontend polling for in-app reminders.
    """
    now = datetime.utcnow()
    due = due_reminders(session, now)
    return {"now": now.isoformat(), "due": [r.model_dump() for r in due]}


@router.post("/reminders/{reminder_id}/mark_sent")
def reminders_mark_sent(reminder_id: int, session: Session = Depends(get_session)):
    """
    Purpose:
    Mark a reminder as sent so it won't show up as due again.
    """
    r = mark_sent(session, reminder_id)
    return r.model_dump()