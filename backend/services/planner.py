from datetime import datetime
from sqlmodel import Session, select
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import Checkpoint
from services.analytics import mastery_by_topic

def compute_study_plan(session: Session, course_id: int, minutes_available: int) -> dict:
    mastery = mastery_by_topic(session, course_id)
    weak = sorted(mastery.items(), key=lambda x: x[1]) if mastery else []

    now = datetime.utcnow()
    cps = session.exec(
        select(Checkpoint)
        .where(Checkpoint.course_id == course_id)
        .where(Checkpoint.status == "pending")
    ).all()
    cps.sort(key=lambda c: (c.due_at, -c.weight))

    blocks = []
    remaining = minutes_available

    for cp in cps[:2]:
        if remaining <= 0:
            break
        due_days = max((cp.due_at - now).days, 0)
        urgency = "high" if due_days <= 3 else ("medium" if due_days <= 7 else "low")
        alloc = min(30 if urgency == "high" else 20, remaining)
        blocks.append({
            "type": "checkpoint",
            "title": f"Prep: {cp.title}",
            "minutes": alloc,
            "why": f"Due in ~{due_days} day(s), weight {cp.weight:.0%}"
        })
        remaining -= alloc

    for topic, m in weak[:3]:
        if remaining <= 0:
            break
        alloc = min(25, remaining)
        blocks.append({
            "type": "weak_topic",
            "title": f"Practice: {topic}",
            "minutes": alloc,
            "why": f"Low mastery ({m:.0%}). Do targeted practice + review mistakes."
        })
        remaining -= alloc

    if remaining > 0:
        blocks.append({
            "type": "review",
            "title": "Review + recap",
            "minutes": remaining,
            "why": "Summarize errors and write quick notes for next session."
        })

    readiness = (sum(mastery.values()) / len(mastery)) if mastery else 0.0
    return {"minutes_available": minutes_available, "readiness": readiness, "plan": blocks}