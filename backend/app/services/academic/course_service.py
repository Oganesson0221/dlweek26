from sqlmodel import Session, select
from datetime import datetime
from ...models.academic import Course, CourseOutline, CourseComponent, TopicNode


def create_course(session: Session, code: str, name: str, term: str) -> Course:
    c = Course(code=code, name=name, term=term)
    session.add(c)
    session.commit()
    session.refresh(c)

    outline = CourseOutline(course_id=c.id, description="", instructor="", last_updated_at=datetime.utcnow())
    session.add(outline)
    session.commit()
    return c


def upsert_outline(session: Session, course_id: int, description: str, instructor: str) -> CourseOutline:
    o = session.exec(select(CourseOutline).where(CourseOutline.course_id == course_id)).first()
    if o is None:
        o = CourseOutline(course_id=course_id, description=description, instructor=instructor)
        session.add(o)
    else:
        o.description = description
        o.instructor = instructor
        o.last_updated_at = datetime.utcnow()

    session.commit()
    session.refresh(o)
    return o


def replace_components(session: Session, course_id: int, components: list[tuple[str, float]]) -> list[CourseComponent]:
    existing = session.exec(select(CourseComponent).where(CourseComponent.course_id == course_id)).all()
    for e in existing:
        session.delete(e)
    session.commit()

    out: list[CourseComponent] = []
    for name, weight in components:
        item = CourseComponent(course_id=course_id, name=name, weight=weight)
        session.add(item)
        out.append(item)
    session.commit()
    return out


def add_topic(session: Session, course_id: int, parent_id: int | None, title: str, order_index: int) -> TopicNode:
    node = TopicNode(course_id=course_id, parent_id=parent_id, title=title, order_index=order_index)
    session.add(node)
    session.commit()
    session.refresh(node)
    return node


def get_topics(session: Session, course_id: int) -> list[TopicNode]:
    nodes = session.exec(select(TopicNode).where(TopicNode.course_id == course_id)).all()
    nodes.sort(key=lambda n: (n.parent_id or 0, n.order_index, n.id or 0))
    return nodes