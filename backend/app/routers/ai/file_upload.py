"""
File parsing endpoints for Quiz generation and Clippy assistant.
Allows uploading PDF/PPTX files and returns parsed content.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List, Optional
from pydantic import BaseModel

from app.services.file_parser import parse_uploaded_file, build_content_string, SlideContent

router = APIRouter(prefix="/ai/files", tags=["AI File Processing"])


class ParsedSlide(BaseModel):
    """Parsed slide/page content"""
    number: int
    heading: str
    body: str
    notes: str = ""
    tables: str = ""


class ParseResponse(BaseModel):
    """Response from file parsing"""
    filename: str
    total_slides: int
    slides: List[ParsedSlide]
    content_string: str  # Combined content for AI processing


class QuizFromFileRequest(BaseModel):
    """Request to generate quiz from uploaded file"""
    title: Optional[str] = None
    topic: Optional[str] = None
    num_mcq: int = 5


@router.post("/parse", response_model=ParseResponse)
async def parse_file(file: UploadFile = File(...)):
    """
    Upload and parse a PDF or PPTX file.
    Returns structured slide content that can be used for:
    - Quiz generation
    - Clippy document understanding
    - Summary generation
    """
    if not file.filename:
        raise HTTPException(400, "No filename provided")
    
    # Read file content
    file_bytes = await file.read()
    
    if len(file_bytes) == 0:
        raise HTTPException(400, "Empty file")
    
    # Parse the file
    try:
        slides = parse_uploaded_file(file.filename, file_bytes)
    except Exception as e:
        raise HTTPException(400, f"Failed to parse file: {str(e)}")
    
    # Build combined content string
    content_string = build_content_string(slides)
    
    return ParseResponse(
        filename=file.filename,
        total_slides=len(slides),
        slides=[
            ParsedSlide(
                number=s.number,
                heading=s.heading,
                body=s.body,
                notes=s.notes,
                tables=s.tables
            )
            for s in slides
        ],
        content_string=content_string
    )


@router.post("/quiz-from-file")
async def generate_quiz_from_file(
    file: UploadFile = File(...),
    title: Optional[str] = None,
    topic: Optional[str] = None,
    num_mcq: int = 5,
):
    """
    Upload a file and directly generate a quiz from it.
    Combines file parsing and quiz generation in one step.
    """
    from app.schemas import QuizGenerateRequest
    from app.services.ai.quiz_services import generate_quiz_from_slides
    
    if not file.filename:
        raise HTTPException(400, "No filename provided")
    
    file_bytes = await file.read()
    
    if len(file_bytes) == 0:
        raise HTTPException(400, "Empty file")
    
    # Parse the file
    try:
        slides = parse_uploaded_file(file.filename, file_bytes)
    except Exception as e:
        raise HTTPException(400, f"Failed to parse file: {str(e)}")
    
    # Generate quiz request
    request = QuizGenerateRequest(
        title=title or f"Quiz from {file.filename}",
        topic=topic,
        num_mcq=num_mcq
    )
    
    # Generate quiz
    quiz = await generate_quiz_from_slides(slides, request, file.filename)
    
    return quiz


@router.post("/content-for-clippy")
async def get_content_for_clippy(file: UploadFile = File(...)):
    """
    Parse a file and return content optimized for Clippy assistant.
    Returns a single content string that Clippy can use for context.
    """
    if not file.filename:
        raise HTTPException(400, "No filename provided")
    
    file_bytes = await file.read()
    
    if len(file_bytes) == 0:
        raise HTTPException(400, "Empty file")
    
    try:
        slides = parse_uploaded_file(file.filename, file_bytes)
    except Exception as e:
        raise HTTPException(400, f"Failed to parse file: {str(e)}")
    
    content_string = build_content_string(slides, max_chars=12000)  # Smaller for chat context
    
    return {
        "filename": file.filename,
        "total_pages": len(slides),
        "content": content_string,
        "summary_prompt": f"This document '{file.filename}' contains {len(slides)} pages/slides. The user may ask questions about it."
    }


# ============ SAVED MATERIALS ENDPOINTS ============

from app.db.mongodb import (
    save_course_material,
    get_course_materials,
    get_course_material_by_id,
    delete_course_material
)
from fastapi import Query

class SavedMaterial(BaseModel):
    """Saved course material metadata"""
    id: str
    filename: str
    title: str
    course_code: Optional[str] = None
    total_slides: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@router.post("/save-material")
async def save_material_endpoint(
    file: UploadFile = File(...),
    course_code: Optional[str] = None,
    title: Optional[str] = None,
    user_id: str = "default"
):
    """
    Upload a file and save parsed content for later quiz generation.
    This allows reusing materials without re-uploading.
    """
    if not file.filename:
        raise HTTPException(400, "No filename provided")
    
    file_bytes = await file.read()
    
    if len(file_bytes) == 0:
        raise HTTPException(400, "Empty file")
    
    # Parse the file
    try:
        slides = parse_uploaded_file(file.filename, file_bytes)
    except Exception as e:
        raise HTTPException(400, f"Failed to parse file: {str(e)}")
    
    # Save to MongoDB
    slides_data = [
        {
            "number": s.number,
            "heading": s.heading,
            "body": s.body,
            "notes": s.notes,
            "tables": s.tables
        }
        for s in slides
    ]
    
    result = save_course_material(
        filename=file.filename,
        slides=slides_data,
        course_code=course_code,
        user_id=user_id,
        title=title
    )
    
    return {
        "message": "Material saved successfully",
        "id": result.get("id"),
        "filename": file.filename,
        "total_slides": len(slides),
        "course_code": course_code
    }


@router.get("/saved-materials")
async def get_saved_materials(
    user_id: str = Query("default"),
    course_code: Optional[str] = Query(None)
):
    """Get all saved course materials for a user."""
    materials = get_course_materials(user_id=user_id, course_code=course_code)
    return {
        "materials": [
            {
                "id": m.get("id"),
                "filename": m.get("filename"),
                "title": m.get("title"),
                "course_code": m.get("course_code"),
                "total_slides": m.get("total_slides"),
                "created_at": m.get("created_at"),
                "updated_at": m.get("updated_at")
            }
            for m in materials
        ]
    }


@router.post("/quiz-from-saved/{material_id}")
async def generate_quiz_from_saved_material(
    material_id: str,
    title: Optional[str] = None,
    topic: Optional[str] = None,
    num_mcq: int = 5
):
    """Generate a quiz from a previously saved material."""
    from app.schemas import QuizGenerateRequest
    from app.services.ai.quiz_services import generate_quiz_from_slides
    
    material = get_course_material_by_id(material_id)
    if not material:
        raise HTTPException(404, "Material not found")
    
    # Convert saved slides back to SlideContent objects
    slides = [
        SlideContent(
            number=s.get("number", 0),
            heading=s.get("heading", ""),
            body=s.get("body", ""),
            notes=s.get("notes", ""),
            tables=s.get("tables", "")
        )
        for s in material.get("slides", [])
    ]
    
    request = QuizGenerateRequest(
        title=title or f"Quiz from {material.get('title', 'Saved Material')}",
        topic=topic,
        num_mcq=num_mcq
    )
    
    quiz = await generate_quiz_from_slides(slides, request, material.get("filename", "saved_material"))
    
    return quiz


@router.delete("/saved-materials/{material_id}")
async def delete_saved_material(
    material_id: str,
    user_id: str = Query("default")
):
    """Delete a saved course material."""
    deleted = delete_course_material(material_id, user_id)
    if not deleted:
        raise HTTPException(404, "Material not found or already deleted")
    return {"message": "Material deleted successfully"}