"""
API endpoints for progress tracking, template generation, and email drafts.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.db.mongodb import get_assignment, get_outline, get_components
from app.services.ai.progress_tracker import (
    analyze_progress,
    generate_email_draft,
    generate_template_with_ai
)

router = APIRouter(tags=["academic-editor"])


class ProgressAnalysisRequest(BaseModel):
    assignment_id: str
    content: str
    template_structure: Optional[Dict[str, Any]] = None


class ProgressAnalysisResponse(BaseModel):
    overall_progress: int
    sections: List[Dict[str, Any]]
    strengths: List[str]
    improvements: List[str]
    estimated_score: Optional[int] = None
    rubric_breakdown: Optional[List[Dict[str, Any]]] = None


class EmailDraftRequest(BaseModel):
    assignment_id: str
    email_type: str = "submission_confirmation"
    student_name: str = "Student"


class EmailDraftResponse(BaseModel):
    subject: str
    body: str


class TemplateStructureRequest(BaseModel):
    assignment_id: str
    template_type: str = "word"


@router.post("/analyze-progress", response_model=ProgressAnalysisResponse)
async def analyze_assignment_progress(request: ProgressAnalysisRequest):
    """
    Analyze student's progress on an assignment using AI.
    Returns section-by-section completion and feedback.
    """
    # Try to get assignment, but don't require it (allow temp IDs)
    assignment = get_assignment(request.assignment_id)
    
    # Get rubric if available from course components
    rubric = None
    if assignment:
        course_code = assignment.get("course_code")
        if course_code:
            components = get_components(course_code)
            # Try to find matching component for rubric
            for comp in components:
                if comp.get("name", "").lower() in assignment.get("title", "").lower():
                    rubric = comp.get("rubric", [])
                    break
    
    # Build template structure if not provided
    template = request.template_structure or {
        "title": assignment.get("title", "Assignment") if assignment else "Assignment",
        "sections": [
            {"name": "Introduction", "required": True},
            {"name": "Main Content", "required": True},
            {"name": "Conclusion", "required": True},
            {"name": "References", "required": False}
        ]
    }
    
    result = await analyze_progress(template, request.content, rubric)
    
    return ProgressAnalysisResponse(
        overall_progress=result.get("overall_progress", 0),
        sections=result.get("sections", []),
        strengths=result.get("strengths", []),
        improvements=result.get("improvements", []),
        estimated_score=result.get("estimated_score"),
        rubric_breakdown=result.get("rubric_breakdown")
    )


@router.post("/generate-email", response_model=EmailDraftResponse)
async def generate_email(request: EmailDraftRequest):
    """
    Generate a professional email draft for professor communication.
    """
    # Try to get assignment, but allow temp IDs
    assignment = get_assignment(request.assignment_id)
    
    # If no assignment, create a basic one for temp IDs
    if not assignment:
        assignment = {
            "_id": request.assignment_id,
            "title": "Assignment",
            "description": "General assignment submission",
            "course_code": "COURSE"
        }
    
    # Get instructor info from course outline
    instructor_name = "Professor"
    course_code = assignment.get("course_code")
    if course_code and course_code != "COURSE" and course_code != "TEMP":
        outline = get_outline(course_code)
        if outline and outline.get("instructor"):
            instructor_name = outline["instructor"]
    
    result = await generate_email_draft(
        assignment=assignment,
        instructor_name=instructor_name,
        student_name=request.student_name,
        email_type=request.email_type
    )
    
    return EmailDraftResponse(
        subject=result.get("subject", ""),
        body=result.get("body", "")
    )


@router.post("/generate-template-structure")
async def generate_template_structure(request: TemplateStructureRequest):
    """
    Generate an AI-enhanced template structure for an assignment.
    """
    # Try to get assignment, but allow temp IDs
    assignment = get_assignment(request.assignment_id)
    
    # If no assignment, create a basic one for temp IDs
    if not assignment:
        assignment = {
            "_id": request.assignment_id,
            "title": "Assignment",
            "description": "General assignment",
            "course_code": "TEMP"
        }
    
    # Get rubric if available
    rubric = None
    course_code = assignment.get("course_code")
    if course_code and course_code != "TEMP":
        components = get_components(course_code)
        for comp in components:
            if comp.get("name", "").lower() in assignment.get("title", "").lower():
                rubric = comp.get("rubric", [])
                break
    
    result = await generate_template_with_ai(
        assignment=assignment,
        template_type=request.template_type,
        rubric=rubric
    )
    
    return result


@router.get("/assignment/{assignment_id}/template-progress")
async def get_template_progress(assignment_id: str):
    """
    Get saved progress for an assignment template.
    Works with both real assignments and temp IDs.
    """
    from app.db.mongodb import get_db
    
    db = get_db()
    progress = db.template_progress.find_one({"assignment_id": assignment_id})
    
    if not progress:
        return {
            "assignment_id": assignment_id,
            "content": "",
            "template_structure": None,
            "last_saved": None,
            "progress_stats": None
        }
    
    # Serialize ObjectId
    if "_id" in progress:
        progress["id"] = str(progress["_id"])
        del progress["_id"]
    
    return progress


@router.post("/assignment/{assignment_id}/save-progress")
async def save_template_progress(assignment_id: str, data: Dict[str, Any]):
    """
    Save progress on an assignment template.
    Works with both real assignments and temp IDs.
    """
    from app.db.mongodb import get_db
    from datetime import datetime
    
    db = get_db()
    
    update_data = {
        "assignment_id": assignment_id,
        "content": data.get("content", ""),
        "template_structure": data.get("template_structure"),
        "progress_stats": data.get("progress_stats"),
        "last_saved": datetime.utcnow()
    }
    
    db.template_progress.update_one(
        {"assignment_id": assignment_id},
        {"$set": update_data},
        upsert=True
    )
    
    return {"status": "saved", "last_saved": update_data["last_saved"].isoformat()}
