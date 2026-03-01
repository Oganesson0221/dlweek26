from pathlib import Path
from sqlmodel import Session, select
from pptx import Presentation
from pptx.util import Inches
from ...models.academic import Assignment, Course, GeneratedDocument
from ...core.config import settings


def generate_ppt(session: Session, assignment_id: int) -> GeneratedDocument:
    a = session.exec(select(Assignment).where(Assignment.id == assignment_id)).first()
    if a is None:
        raise ValueError("assignment_not_found")

    c = session.exec(select(Course).where(Course.id == a.course_id)).first()
    if c is None:
        raise ValueError("course_not_found")

    out_dir = Path(settings.generated_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    safe_title = "".join(ch if ch.isalnum() or ch in (" ", "_", "-") else "_" for ch in a.title).strip()
    file_name = f"{c.code}_{safe_title}_slides.pptx"
    file_path = out_dir / file_name

    prs = Presentation()

    # Title
    s = prs.slides.add_slide(prs.slide_layouts[0])
    s.shapes.title.text = f"{c.code} {c.name}"
    s.placeholders[1].text = f"{a.title}\nDue: {a.due_at.isoformat(timespec='minutes')}"

    # Agenda
    s = prs.slides.add_slide(prs.slide_layouts[1])
    s.shapes.title.text = "Agenda"
    tf = s.shapes.placeholders[1].text_frame
    tf.text = "Problem"
    for item in ["Approach", "Results", "Discussion", "Conclusion"]:
        tf.add_paragraph().text = item

    # Sections
    for title in ["Problem", "Approach", "Results", "Conclusion"]:
        s = prs.slides.add_slide(prs.slide_layouts[5])
        s.shapes.title.text = title
        tb = s.shapes.add_textbox(Inches(1), Inches(1.7), Inches(8), Inches(4.6))
        tb.text_frame.text = "Add content here."

    prs.save(str(file_path))

    gd = GeneratedDocument(assignment_id=assignment_id, doc_type="ppt", file_name=file_name, file_path=str(file_path))
    session.add(gd)
    session.commit()
    session.refresh(gd)
    return gd