from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.academic import Course, CourseOutline, CourseComponent
from app.schemas.academic import CourseCreate, OutlineUpsert, ComponentItem, TopicCreate
from app.services.academic.course_service import create_course, upsert_outline, replace_components, add_topic, get_topics

router = APIRouter(prefix="/academic/courses", tags=["academic-courses"])

@router.post("")
def create(body: CourseCreate, session: Session = Depends(get_session)):
    return create_course(session, body.code, body.name, body.term)

@router.get("")
def list_all(session: Session = Depends(get_session)):
    return session.exec(select(Course)).all()

@router.get("/{course_id}")
def get_one(course_id: int, session: Session = Depends(get_session)):
    return session.exec(select(Course).where(Course.id == course_id)).first()

@router.put("/{course_id}/outline")
def outline_upsert(course_id: int, body: OutlineUpsert, session: Session = Depends(get_session)):
    return upsert_outline(session, course_id, body.description, body.instructor)

@router.get("/{course_id}/outline")
def outline_get(course_id: int, session: Session = Depends(get_session)):
    return session.exec(select(CourseOutline).where(CourseOutline.course_id == course_id)).first()

@router.put("/{course_id}/components")
def components_replace(course_id: int, body: list[ComponentItem], session: Session = Depends(get_session)):
    comps = [(c.name, c.weight) for c in body]
    return replace_components(session, course_id, comps)

@router.get("/{course_id}/components")
def components_get(course_id: int, session: Session = Depends(get_session)):
    return session.exec(select(CourseComponent).where(CourseComponent.course_id == course_id)).all()

@router.post("/{course_id}/topics")
def topic_add(course_id: int, body: TopicCreate, session: Session = Depends(get_session)):
    return add_topic(session, course_id, body.parent_id, body.title, body.order_index)

@router.get("/{course_id}/topics")
def topics_get(course_id: int, session: Session = Depends(get_session)):
    return get_topics(session, course_id)