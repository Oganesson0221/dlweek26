"""
File parsing endpoints for Quiz generation and Clippy assistant.
Allows uploading PDF/PPTX files and returns parsed content.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Query
from typing import List, Optional
from pydantic import BaseModel

from app.services.file_parser import parse_uploaded_file, build_content_string, SlideContent
from app.services.ai.summarizer import generate_summary, extract_key_points
from app.services.ai.generate_concept_map import generate_concept_map_bytes
from app.db.mongodb import (
    create_summary, get_all_summaries, get_summary_by_id, delete_summary,
    create_keywords, get_all_keywords, get_keywords_by_id, delete_keywords,
    create_concept_map, get_all_concept_maps, get_concept_map_by_id, delete_concept_map,
    save_course_material, get_course_materials, get_course_material_by_id, delete_course_material
)

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


class SummaryResponse(BaseModel):
    """Response from summary generation"""
    id: str
    filename: str
    course_name: str
    total_pages: int
    summary: str
    created_at: str


class KeywordsResponse(BaseModel):
    """Response from keyword extraction"""
    id: str
    filename: str
    course_name: str
    total_pages: int
    keywords: List[str]
    created_at: str


class ConceptMapResponse(BaseModel):
    """Response from concept map generation"""
    id: str
    filename: str
    course_name: str
    total_pages: int
    concept_map_data: str
    created_at: str


class SavedMaterial(BaseModel):
    """Saved course material metadata"""
    id: str
    filename: str
    title: str
    course_code: Optional[str] = None
    total_slides: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


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


@router.post("/summarize", response_model=SummaryResponse)
async def summarize_file(
    file: UploadFile = File(...),
    course_name: str = Form("Untitled Course"),
):
    """
    Upload a PDF/PPTX file and generate a summary.
    Returns a cohesive summary of the document content and saves to MongoDB.
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
    
    try:
        summary = await generate_summary(slides)
    except Exception as e:
        raise HTTPException(500, f"Failed to generate summary: {str(e)}")
    
    # Save to MongoDB
    saved = create_summary(course_name, file.filename, summary, len(slides))
    
    return SummaryResponse(
        id=saved["id"],
        filename=file.filename,
        course_name=course_name,
        total_pages=len(slides),
        summary=summary,
        created_at=saved["created_at"]
    )


@router.get("/summaries")
async def list_summaries():
    """Get all saved summaries"""
    return get_all_summaries()


@router.get("/summaries/{summary_id}")
async def get_summary(summary_id: str):
    """Get a specific summary by ID"""
    doc = get_summary_by_id(summary_id)
    if not doc:
        raise HTTPException(404, "Summary not found")
    return doc


@router.delete("/summaries/{summary_id}")
async def remove_summary(summary_id: str):
    """Delete a summary by ID"""
    if not delete_summary(summary_id):
        raise HTTPException(404, "Summary not found")
    return {"status": "deleted"}


@router.post("/extract-keywords", response_model=KeywordsResponse)
async def extract_keywords_file(
    file: UploadFile = File(...),
    course_name: str = Form("Untitled Course"),
):
    """
    Upload a PDF/PPTX file and extract key points/keywords.
    Returns a list of key concepts from the document and saves to MongoDB.
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
    
    try:
        keywords = await extract_key_points(slides)
    except Exception as e:
        raise HTTPException(500, f"Failed to extract keywords: {str(e)}")
    
    # Save to MongoDB
    saved = create_keywords(course_name, file.filename, keywords, len(slides))
    
    return KeywordsResponse(
        id=saved["id"],
        filename=file.filename,
        course_name=course_name,
        total_pages=len(slides),
        keywords=keywords,
        created_at=saved["created_at"]
    )


@router.get("/keywords")
async def list_keywords():
    """Get all saved keywords records"""
    return get_all_keywords()


@router.get("/keywords/{keywords_id}")
async def get_keywords(keywords_id: str):
    """Get a specific keywords record by ID"""
    doc = get_keywords_by_id(keywords_id)
    if not doc:
        raise HTTPException(404, "Keywords record not found")
    return doc


@router.delete("/keywords/{keywords_id}")
async def remove_keywords(keywords_id: str):
    """Delete a keywords record by ID"""
    if not delete_keywords(keywords_id):
        raise HTTPException(404, "Keywords record not found")
    return {"status": "deleted"}


@router.post("/generate-concept-map", response_model=ConceptMapResponse)
async def generate_concept_map_from_file(
    file: UploadFile = File(...),
    course_name: str = Form("Untitled Course"),
):
    """
    Upload a PDF/PPTX file and generate an interactive concept map.
    Returns a JavaScript object literal with terminology nodes and relationships.
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
    
    try:
        concept_map_bytes = await generate_concept_map_bytes(slides, file.filename)
        concept_map_data = concept_map_bytes.decode("utf-8")
    except Exception as e:
        raise HTTPException(500, f"Failed to generate concept map: {str(e)}")
    
    # Save to MongoDB
    saved = create_concept_map(course_name, file.filename, concept_map_data, len(slides))
    
    return ConceptMapResponse(
        id=saved["id"],
        filename=file.filename,
        course_name=course_name,
        total_pages=len(slides),
        concept_map_data=concept_map_data,
        created_at=saved["created_at"]
    )


@router.get("/concept-maps")
async def list_concept_maps():
    """Get all saved concept maps"""
    return get_all_concept_maps()


@router.get("/concept-maps/{concept_map_id}")
async def get_concept_map(concept_map_id: str):
    """Get a specific concept map by ID"""
    doc = get_concept_map_by_id(concept_map_id)
    if not doc:
        raise HTTPException(404, "Concept map not found")
    return doc


@router.delete("/concept-maps/{concept_map_id}")
async def remove_concept_map(concept_map_id: str):
    """Delete a concept map by ID"""
    if not delete_concept_map(concept_map_id):
        raise HTTPException(404, "Concept map not found")
    return {"status": "deleted"}