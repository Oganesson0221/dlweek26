from datetime import datetime, timedelta
from typing import Dict, Tuple, Optional
from sqlmodel import Session, select
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import QuizAttempt

def mastery_by_topic(session: Session, course_id: int) -> Dict[str, float]:
    attempts = session.exec(select(QuizAttempt).where(QuizAttempt.course_id == course_id)).all()
    if not attempts:
        return {}

    now = datetime.utcnow()
    scores: Dict[str, Tuple[float, float]] = {}

    for a in attempts:
        age_days = (now - a.created_at).days
        w = 1.4 if age_days <= 14 else 1.0
        wc, wt = scores.get(a.topic, (0.0, 0.0))
        wc += w * a.correct
        wt += w * max(a.total, 1)
        scores[a.topic] = (wc, wt)

    return {t: (wc / wt if wt else 0.0) for t, (wc, wt) in scores.items()}

def improvement_trend(session: Session, course_id: int, topic: Optional[str] = None) -> dict:
    now = datetime.utcnow()
    w1_start = now - timedelta(days=7)
    w2_start = now - timedelta(days=14)

    q = select(QuizAttempt).where(QuizAttempt.course_id == course_id)
    if topic:
        q = q.where(QuizAttempt.topic == topic)
    attempts = session.exec(q).all()
    if not attempts:
        return {"status": "no_data"}

    def agg(start, end):
        c, t = 0, 0
        for a in attempts:
            if start <= a.created_at < end:
                c += a.correct
                t += a.total
        return c, t

    c1, t1 = agg(w1_start, now)
    c2, t2 = agg(w2_start, w1_start)
    acc1 = (c1 / t1) if t1 else None
    acc2 = (c2 / t2) if t2 else None
    delta = (acc1 - acc2) if (acc1 is not None and acc2 is not None) else None

    return {"status": "ok", "acc_last_7d": acc1, "acc_prev_7d": acc2, "delta": delta}