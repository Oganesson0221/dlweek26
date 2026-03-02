from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.schemas.academic import AssignmentCreate, AssignmentStatusUpdate
from app.db.mongodb import (
    get_course,
    create_assignment,
    list_assignments,
    get_assignment,
    update_assignment_status,
    get_reminders,
    get_workplan,
)

router = APIRouter(prefix="/academic/submissions", tags=["academic-submissions"])


def get_course_or_404(course_code: str) -> dict:
    course = get_course(course_code)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post("/courses/{course_code}/assignments")
def assignment_create(course_code: str, body: AssignmentCreate):
    """Create a new assignment for a course."""
    get_course_or_404(course_code)
    
    due_at = body.due_at
    if isinstance(due_at, str):
        due_at = datetime.fromisoformat(due_at.replace("Z", "+00:00"))
    
    return create_assignment(
        course_code=course_code,
        title=body.title,
        description=body.description or "",
        due_at=due_at,
        weight=body.weight
    )


@router.get("/courses/{course_code}/assignments")
def assignment_list(course_code: str):
    """List all assignments for a course."""
    get_course_or_404(course_code)
    assignments = list_assignments(course_code)
    return {"assignments": assignments}


@router.patch("/assignments/{assignment_id}/status")
def assignment_status(assignment_id: str, body: AssignmentStatusUpdate):
    """Update assignment status."""
    result = update_assignment_status(assignment_id, body.status)
    if not result:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return result


@router.get("/assignments/{assignment_id}/reminders")
def assignment_reminders(assignment_id: str):
    """Get reminders for an assignment."""
    assignment = get_assignment(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    reminders = get_reminders(assignment_id)
    return {"reminders": reminders}


@router.get("/assignments/{assignment_id}/workplan")
def assignment_workplan(assignment_id: str):
    """Get work plan for an assignment."""
    assignment = get_assignment(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    workplan = get_workplan(assignment_id)
    return {"workplan": workplan}
