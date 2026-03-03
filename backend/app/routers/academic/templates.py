from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from app.db.session import get_session
from app.schemas.academic import TemplateGenRequest
from app.models.academic import GeneratedDocument
from app.services.academic.template_word import generate_word
from app.services.academic.template_ppt import generate_ppt

router = APIRouter(tags=["academic-templates"])

@router.post("/word")
def gen_word(body: TemplateGenRequest, session: Session = Depends(get_session)):
    return generate_word(session, body.assignment_id)

@router.post("/ppt")
def gen_ppt(body: TemplateGenRequest, session: Session = Depends(get_session)):
    return generate_ppt(session, body.assignment_id)

@router.get("/download/{doc_id}")
def download(doc_id: int, session: Session = Depends(get_session)):
    doc = session.exec(select(GeneratedDocument).where(GeneratedDocument.id == doc_id)).first()
    if not doc:
        return {"error": "document_not_found"}
    return FileResponse(path=doc.file_path, filename=doc.file_name)