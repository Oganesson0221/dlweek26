from datetime import datetime, timedelta
from sqlmodel import Session, select
from ...models.academic import Reminder, Assignment
from ...core.config import settings


def schedule_default_reminders(session: Session, assignment_id: int) -> list[Reminder]:
    a = session.exec(select(Assignment).where(Assignment.id == assignment_id)).first()
    if a is None:
        raise ValueError("assignment_not_found")

    # cancel existing scheduled reminders
    existing = session.exec(
        select(Reminder).where(Reminder.assignment_id == assignment_id).where(Reminder.status == "scheduled")
    ).all()
    for r in existing:
        r.status = "cancelled"
    session.commit()

    created: list[Reminder] = []
    for hrs in settings.reminder_default_leads_hours:
        remind_at = a.due_at - timedelta(hours=hrs)
        msg = f"Reminder: '{a.title}' due {a.due_at.isoformat(timespec='minutes')}."
        r = Reminder(assignment_id=assignment_id, remind_at=remind_at, channel="in_app", message=msg)
        session.add(r)
        created.append(r)

    session.commit()
    return created


def due_reminders(session: Session, now: datetime) -> list[Reminder]:
    return session.exec(
        select(Reminder).where(Reminder.status == "scheduled").where(Reminder.remind_at <= now)
    ).all()


def mark_sent(session: Session, reminder_id: int) -> Reminder:
    r = session.exec(select(Reminder).where(Reminder.id == reminder_id)).first()
    if r is None:
        raise ValueError("reminder_not_found")
    r.status = "sent"
    session.commit()
    session.refresh(r)
    return r