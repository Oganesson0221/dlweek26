from fastapi import APIRouter
from datetime import datetime, timedelta
from typing import List
from pydantic import BaseModel
from app.db.mongodb import (
    get_all_assignments,
    get_due_reminders,
    mark_reminder_sent,
    create_workplan,
    get_assignment,
)

router = APIRouter(tags=["academic-deadlines"])


class ConflictQuery(BaseModel):
    assignment_ids: List[str]


class StartDateSuggestRequest(BaseModel):
    assignment_id: str
    planned_hours: float = 6.0
    difficulty: str = "medium"


@router.get("/ping")
def ping():
    """Health check for deadlines service."""
    return {"status": "ok", "service": "deadlines"}


@router.post("/conflicts")
def check_conflicts(body: ConflictQuery):
    """Check for deadline conflicts between assignments."""
    assignments = []
    for aid in body.assignment_ids:
        a = get_assignment(aid)
        if a:
            assignments.append(a)
    
    # Find overlapping deadlines (within 24 hours of each other)
    conflicts = []
    for i, a1 in enumerate(assignments):
        for a2 in assignments[i+1:]:
            due1 = a1.get("due_at")
            due2 = a2.get("due_at")
            
            if isinstance(due1, str):
                due1 = datetime.fromisoformat(due1.replace("Z", "+00:00"))
            if isinstance(due2, str):
                due2 = datetime.fromisoformat(due2.replace("Z", "+00:00"))
            
            if due1 and due2:
                diff = abs((due1 - due2).total_seconds())
                if diff < 86400:  # Within 24 hours
                    conflicts.append({
                        "assignment_1": a1["title"],
                        "assignment_2": a2["title"],
                        "hours_apart": diff / 3600
                    })
    
    return {"conflicts": conflicts, "has_conflicts": len(conflicts) > 0}


@router.post("/suggest_start")
def suggest_start_date(body: StartDateSuggestRequest):
    """Suggest a start date for an assignment based on difficulty and planned hours."""
    assignment = get_assignment(body.assignment_id)
    if not assignment:
        return {"error": "Assignment not found"}
    
    due_at = assignment.get("due_at")
    if isinstance(due_at, str):
        due_at = datetime.fromisoformat(due_at.replace("Z", "+00:00"))
    
    if not due_at:
        return {"error": "Assignment has no due date"}
    
    # Calculate buffer based on difficulty
    difficulty_buffers = {
        "easy": 1,
        "medium": 2,
        "hard": 4
    }
    buffer_days = difficulty_buffers.get(body.difficulty, 2)
    
    # Suggest start date
    hours_needed = body.planned_hours
    days_needed = max(1, hours_needed / 4)  # Assume 4 hours of work per day
    total_days = days_needed + buffer_days
    
    suggested_start = due_at - timedelta(days=total_days)
    
    rationale = f"Based on {hours_needed} planned hours and {body.difficulty} difficulty, start {total_days:.0f} days before deadline."
    
    # Save workplan
    workplan = create_workplan(
        assignment_id=body.assignment_id,
        suggested_start_at=suggested_start,
        planned_hours=body.planned_hours,
        difficulty=body.difficulty,
        rationale=rationale
    )
    
    return {
        "assignment_id": body.assignment_id,
        "due_at": due_at.isoformat(),
        "suggested_start_at": suggested_start.isoformat(),
        "planned_hours": body.planned_hours,
        "difficulty": body.difficulty,
        "rationale": rationale,
        "workplan": workplan
    }


@router.get("/reminders/due")
def get_due_reminders_endpoint():
    """Get all reminders that are due now."""
    reminders = get_due_reminders()
    return {"reminders": reminders}


@router.post("/reminders/{reminder_id}/mark_sent")
def mark_sent(reminder_id: str):
    """Mark a reminder as sent."""
    success = mark_reminder_sent(reminder_id)
    if not success:
        return {"error": "Reminder not found"}
    return {"status": "marked_sent", "reminder_id": reminder_id}
