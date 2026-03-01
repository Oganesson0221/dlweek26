from pathlib import Path
from datetime import datetime
from sqlmodel import Session, select
from docx import Document
from app.models.academic import Assignment, Course, GeneratedDocument
from app.core.config import settings


def generate_word(session: Session, assignment_id: int) -> GeneratedDocument:
    a = session.exec(select(Assignment).where(Assignment.id == assignment_id)).first()
    if a is None:
        raise ValueError("assignment_not_found")

    c = session.exec(select(Course).where(Course.id == a.course_id)).first()
    if c is None:
        raise ValueError("course_not_found")

    out_dir = Path(settings.generated_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    safe_title = "".join(ch if ch.isalnum() or ch in (" ", "_", "-") else "_" for ch in a.title).strip()
    file_name = f"{c.code}_{safe_title}_template.docx"
    file_path = out_dir / file_name

    doc = Document()
    doc.add_heading(f"{c.code} {c.name}", level=1)
    doc.add_paragraph(f"Assignment: {a.title}")
    doc.add_paragraph(f"Due: {a.due_at.isoformat(timespec='minutes')}")
    doc.add_paragraph("")

    for sec in ["Introduction", "Requirements", "Methodology", "Results", "Discussion", "Conclusion"]:
        doc.add_heading(sec, level=2)
        doc.add_paragraph("Write here...")

    doc.add_paragraph("")
    doc.add_paragraph(f"Generated on {datetime.utcnow().isoformat(timespec='minutes')} UTC")
    doc.save(str(file_path))

    gd = GeneratedDocument(assignment_id=assignment_id, doc_type="word", file_name=file_name, file_path=str(file_path))
    session.add(gd)
    session.commit()
    session.refresh(gd)
    return gd