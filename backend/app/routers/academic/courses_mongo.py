from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.schemas.academic import CourseCreate, OutlineUpsert, ComponentItem, TopicCreate
from app.db.mongodb import (
    create_course as mongo_create_course,
    list_courses as mongo_list_courses,
    get_course as mongo_get_course,
    get_outline,
    upsert_outline,
    get_components,
    replace_components,
    get_topics,
    add_topic,
)
from app.services.academic.ingest_course_material_mongo import ingest_course_material

router = APIRouter(tags=["academic-courses"])


def get_course_or_404(course_code: str) -> dict:
    course = mongo_get_course(course_code)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post("")
def create(body: CourseCreate):
    """Create a new course."""
    return mongo_create_course(body.code, body.name, body.term)


@router.get("")
def list_all():
    """Returns all courses."""
    return mongo_list_courses()


@router.get("/{course_code}")
def get_course_route(course_code: str):
    """Returns details of a specific course."""
    return get_course_or_404(course_code)


@router.get("/{course_code}/outline")
def outline_get(course_code: str):
    course = get_course_or_404(course_code)
    outline = get_outline(course_code)
    return {
        "course_code": course["code"],
        "outline": outline
    }


@router.put("/{course_code}/outline")
def outline_upsert_route(course_code: str, body: OutlineUpsert):
    """Update or create outline."""
    get_course_or_404(course_code)
    return upsert_outline(course_code, body.description, body.instructor)


@router.get("/{course_code}/components")
def components_get(course_code: str):
    course = get_course_or_404(course_code)
    comps = get_components(course_code)
    return {
        "course_code": course["code"],
        "components": comps
    }


@router.put("/{course_code}/components")
def components_replace_route(course_code: str, body: list[ComponentItem]):
    """Replace all components for a course."""
    get_course_or_404(course_code)
    comps = [(c.name, c.weight) for c in body]
    return replace_components(course_code, comps)


@router.get("/{course_code}/topics")
def topics_get(course_code: str):
    """Get topic hierarchy."""
    get_course_or_404(course_code)
    return get_topics(course_code)


@router.post("/{course_code}/topics")
def topic_add_route(course_code: str, body: TopicCreate):
    """Add a topic."""
    get_course_or_404(course_code)
    return add_topic(course_code, body.parent_id, body.title, body.order_index)


@router.post("/upload")
async def create_with_upload(
    code: str = Form(...),
    name: str = Form(...),
    term: str = Form("Y2S2"),
    file: UploadFile = File(...),
):
    """Create course + upload syllabus file. Auto-extract content."""
    course = mongo_create_course(code, name, term)
    result = await ingest_course_material(course["id"], code, file)
    return {"course": course, "ingest": result}
