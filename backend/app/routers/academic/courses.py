from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

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

router = APIRouter(prefix="/academic/courses", tags=["academic-courses"])


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


# =====================================================
# 4. Course Outline
# =====================================================
@router.put("/{course_code}/outline")
def outline_upsert(course_code: str, body: OutlineUpsert, session: Session = Depends(get_session)):
    """
    Save or update course outline information.
    """
    course = get_course_or_404(session, course_code)
    return upsert_outline(session, course.id, body.description, body.instructor)


@router.get("/{course_code}/outline")
def outline_get(course_code: str, session: Session = Depends(get_session)):
    """
    Get course outline.
    """
    course = get_course_or_404(session, course_code)
    return session.exec(
        select(CourseOutline).where(CourseOutline.course_id == course.id)
    ).first()


# =====================================================
# 5. Weightage Components
# =====================================================
@router.put("/{course_code}/components")
def components_replace(course_code: str, body: list[ComponentItem], session: Session = Depends(get_session)):
    """
    Replace assessment weightage.
    Example: Final 40%, Project 30%
    """
    course = get_course_or_404(session, course_code)
    comps = [(c.name, c.weight) for c in body]
    return replace_components(session, course.id, comps)


@router.get("/{course_code}/components")
def components_get(course_code: str, session: Session = Depends(get_session)):
    """
    Get assessment weightage.
    """
    course = get_course_or_404(session, course_code)
    return session.exec(
        select(CourseComponent).where(CourseComponent.course_id == course.id)
    ).all()


# =====================================================
# 6. Topic Hierarchy (Concept Tree)
# =====================================================
@router.post("/{course_code}/topics")
def topic_add(course_code: str, body: TopicCreate, session: Session = Depends(get_session)):
    """
    Add topic or subtopic.
    Used for concept maps / learning structure.
    """
    course = get_course_or_404(session, course_code)
    return add_topic(session, course.id, body.parent_id, body.title, body.order_index)


@router.get("/{course_code}/topics")
def topics_get(course_code: str, session: Session = Depends(get_session)):
    """
    Get full topic hierarchy for the course.
    """
    course = get_course_or_404(session, course_code)
    return get_topics(session, course.id)