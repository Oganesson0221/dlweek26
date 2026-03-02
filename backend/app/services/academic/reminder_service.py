from datetime import datetime, timedelta
from typing import List
from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.config import settings
from app.models.academic import Assignment, Reminder


def schedule_default_reminders(session: Session, assignment_id: int) -> List[Reminder]:
    """
    Create default reminders for an assignment (e.g., 7d, 3d, 1d before due).
    Always commits.
    """
    assignment = session.exec(select(Assignment).where(Assignment.id == assignment_id)).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Use your Settings field name (pick one and keep consistent)
    leads = getattr(settings, "REMINDER_DEFAULT_LEADS_HOURS", None)
    if not leads:
        leads = [168, 72, 24]  # fallback

    created: List[Reminder] = []

    for hours in leads:
        remind_at = assignment.due_at - timedelta(hours=int(hours))

        r = Reminder(
            assignment_id=assignment.id,  # IMPORTANT
            remind_at=remind_at,
            channel="in_app",
            message=f"Reminder: '{assignment.title}' due {assignment.due_at.isoformat()}",
            status="scheduled",
        )
        session.add(r)
        created.append(r)

    session.commit()

    for r in created:
        session.refresh(r)

    return created


def due_reminders(session: Session, now: datetime) -> List[Reminder]:
    return session.exec(
        select(Reminder).where(Reminder.status == "scheduled").where(Reminder.remind_at <= now)
    ).all()


def mark_sent(session: Session, reminder_id: int) -> Reminder:
    r = session.exec(select(Reminder).where(Reminder.id == reminder_id)).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reminder not found")

    r.status = "sent"
    session.add(r)
    session.commit()
    session.refresh(r)
    return r