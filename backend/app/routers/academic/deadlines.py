from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.academic import Course, Assignment
from app.schemas.academic import ConflictQuery, StartDateSuggestRequest
from app.services.academic.deadline_intel import detect_conflicts, suggest_start_date, upsert_work_plan
from app.services.academic.reminder_service import due_reminders, mark_sent

router = APIRouter(prefix="/academic/deadlines", tags=["academic-deadlines"])


def get_course_or_404(session: Session, course_code: str):
    course = session.exec(select(Course).where(Course.code == course_code)).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


# Conflict detection (across all courses)
@router.post("/conflicts")
def conflicts(body: ConflictQuery, session: Session = Depends(get_session)):
    return detect_conflicts(session, body.window_hours)


# Suggest start date (assignment_id still required)
@router.post("/suggest_start")
def suggest_start(body: StartDateSuggestRequest, session: Session = Depends(get_session)):
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
        "suggestion": s,
        "workplan": wp
    }


# Reminder engine
@router.get("/reminders/due")
def reminders_due(session: Session = Depends(get_session)):
    now = datetime.utcnow()
    due = due_reminders(session, now)
    return {"now": now.isoformat(), "due": due}


@router.post("/reminders/{reminder_id}/mark_sent")
def reminders_mark_sent(reminder_id: int, session: Session = Depends(get_session)):
    return mark_sent(session, reminder_id)