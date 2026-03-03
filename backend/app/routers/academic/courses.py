from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from fastapi import UploadFile, File, Form
from app.services.academic.ingest_course_material import ingest_course_material

from app.db.session import get_session
from app.models.academic import Course, CourseOutline, CourseComponent
from app.schemas.academic import CourseCreate, OutlineUpsert, ComponentItem, TopicCreate
from app.services.academic.course_service import (
    create_course,
    upsert_outline,
    replace_components,
    add_topic,
    get_topics,
)

router = APIRouter(tags=["academic-courses"])


# -----------------------------
# Helper: get course by code
# -----------------------------
def get_course_or_404(session: Session, course_code: str) -> Course:
    course = session.exec(
        select(Course).where(Course.code == course_code)
    ).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return course


# =====================================================
# 1. Create Course
# =====================================================
@router.post("")
def create(body: CourseCreate, session: Session = Depends(get_session)):
    """
    Create a new course.

    Used when a student adds a course for the semester.
    """
    return create_course(session, body.code, body.name, body.term)


# =====================================================
# 2. List all courses
# =====================================================
@router.get("")
def list_all(session: Session = Depends(get_session)):
    """
    Returns all courses for the user.
    """
    return session.exec(select(Course)).all()


# =====================================================
# 3. Get course by code
# =====================================================
@router.get("/{course_code}")
def get_course(course_code: str, session: Session = Depends(get_session)):
    """
    Returns details of a specific course.
    Example: /academic/courses/SC2006
    """
    return get_course_or_404(session, course_code)

# -----------------------------
# OUTLINE (DB read/write)
# -----------------------------
@router.get("/{course_code}/outline")
def outline_get(course_code: str, session: Session = Depends(get_session)):
    course = get_course_or_404(session, course_code)

    outline = session.exec(
        select(CourseOutline).where(CourseOutline.course_id == course.id)
    ).first()

    if not outline:
        return {
            "course_code": course.code,
            "outline": None
        }

    return {
        "course_code": course.code,
        "outline": {
            "description": outline.description,
            "instructor": outline.instructor,
            "last_updated_at": outline.last_updated_at
        }
    }


@router.put("/{course_code}/outline")
def outline_upsert(course_code: str, body: OutlineUpsert, session: Session = Depends(get_session)):
    """
    Purpose:
    Allows manual overwrite/edit of the outline after ingestion.
    """
    course = get_course_or_404(session, course_code)
    return upsert_outline(session, course.id, body.description, body.instructor)


# -----------------------------
# COMPONENTS (DB read/write)
# -----------------------------
@router.get("/{course_code}/components")
def components_get(course_code: str, session: Session = Depends(get_session)):
    course = get_course_or_404(session, course_code)

    comps = session.exec(
        select(CourseComponent).where(CourseComponent.course_id == course.id)
    ).all()

    return {
        "course_code": course.code,
        "components": [
            {
                "name": c.name,
                "weight": c.weight
            }
            for c in comps
        ]
    }


@router.put("/{course_code}/components")
def components_replace(course_code: str, body: list[ComponentItem], session: Session = Depends(get_session)):
    """
    Purpose:
    Allows manual overwrite/edit of grading breakdown after ingestion.
    Replaces all components for that course.
    """
    course = get_course_or_404(session, course_code)
    comps = [(c.name, c.weight) for c in body]
    return replace_components(session, course.id, comps)


# -----------------------------
# TOPICS (DB read/write)
# -----------------------------
@router.get("/{course_code}/topics")
def topics_get(course_code: str, session: Session = Depends(get_session)):
    """
    Purpose:
    Read topic hierarchy saved during ingestion.
    Used for concept maps and navigation UI.
    """
    course = get_course_or_404(session, course_code)
    return get_topics(session, course.id)


@router.post("/{course_code}/topics")
def topic_add(course_code: str, body: TopicCreate, session: Session = Depends(get_session)):
    """
    Purpose:
    Allows manual adding of topics/subtopics after ingestion.
    """
    course = get_course_or_404(session, course_code)
    return add_topic(session, course.id, body.parent_id, body.title, body.order_index)

#upload files + openai parsing

@router.post("/upload")
async def create_with_upload(
    code: str = Form(...),
    name: str = Form(...),
    term: str = Form(...),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    """
    Create course + upload syllabus/outline file.
    Auto-extract outline, grading components, and topics.
    """
    course = create_course(session, code, name, term)
    result = await ingest_course_material(session, course.id, course.code, file)
    return {"course": course, "ingest": result}