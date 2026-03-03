from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.schemas.academic import TemplateGenRequest
from app.db.mongodb import get_assignment, get_generated_doc, save_generated_doc
from app.services.academic.template_generators import generate_word_doc, generate_ppt_doc

router = APIRouter( tags=["academic-templates"])


@router.post("/word")
async def gen_word(body: TemplateGenRequest):
    """Generate a Word document template for an assignment."""
    assignment = get_assignment(body.assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    result = await generate_word_doc(assignment)
    return result


@router.post("/ppt")
async def gen_ppt(body: TemplateGenRequest):
    """Generate a PowerPoint template for an assignment."""
    assignment = get_assignment(body.assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    result = await generate_ppt_doc(assignment)
    return result


@router.get("/download/{doc_id}")
def download(doc_id: str):
    """Download a generated document."""
    doc = get_generated_doc(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return FileResponse(path=doc["file_path"], filename=doc["file_name"])
