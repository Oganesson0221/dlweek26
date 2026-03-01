"""
File parser: extracts structured text from PDF and PPTX/PPT files.
Returns a list of "pages" — each with its number, heading, and body text.
This structure lets GPT reference specific slides in questions.
"""
import os
import io
from dataclasses import dataclass
from typing import List
from fastapi import HTTPException


@dataclass
class SlideContent:
    """Text content from a single slide or PDF page."""
    number: int          # Slide/page number (1-indexed)
    heading: str         # Title or first heading
    body: str            # Body text
    notes: str           # Speaker notes (PPTX only)
    tables: str          # Any table content

    def to_text_block(self) -> str:
        """Format for feeding into GPT prompt."""
        parts = [f"[Slide {self.number}]"]
        if self.heading:
            parts.append(f"Title: {self.heading}")
        if self.body:
            parts.append(self.body)
        if self.tables:
            parts.append(f"Table data:\n{self.tables}")
        if self.notes:
            parts.append(f"Notes: {self.notes}")
        return "\n".join(parts)


# ─── PDF Extraction ───────────────────────────────────────────────────────────

def extract_pdf(file_bytes: bytes, max_pages: int = 80) -> List[SlideContent]:
    """Extract text from a PDF file, returning one SlideContent per page."""
    try:
        from pypdf import PdfReader
    except ImportError:
        raise RuntimeError("pypdf not installed. Run: pip install pypdf")

    reader = PdfReader(io.BytesIO(file_bytes))
    total_pages = min(len(reader.pages), max_pages)

    if total_pages == 0:
        raise HTTPException(400, "PDF has no readable pages.")

    slides = []
    for i in range(total_pages):
        page = reader.pages[i]
        text = page.extract_text() or ""

        lines = [l.strip() for l in text.split("\n") if l.strip()]
        heading = lines[0] if lines else f"Page {i + 1}"
        body = "\n".join(lines[1:]) if len(lines) > 1 else ""

        # Try pdfplumber for better table support (optional)
        table_text = ""
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                if i < len(pdf.pages):
                    tables = pdf.pages[i].extract_tables()
                    for table in tables:
                        for row in table:
                            clean_row = [str(cell or "").strip() for cell in row]
                            table_text += " | ".join(clean_row) + "\n"
        except ImportError:
            pass  # pdfplumber optional

        slides.append(SlideContent(
            number=i + 1,
            heading=heading[:120],
            body=body,
            notes="",
            tables=table_text.strip(),
        ))

    return slides


# ─── PPTX Extraction ──────────────────────────────────────────────────────────

def extract_pptx(file_bytes: bytes, max_slides: int = 80) -> List[SlideContent]:
    """Extract text from a PPTX file, returning one SlideContent per slide."""
    try:
        from pptx import Presentation
        from pptx.util import Pt
    except ImportError:
        raise RuntimeError("python-pptx not installed. Run: pip install python-pptx")

    prs = Presentation(io.BytesIO(file_bytes))
    slides = []

    for i, slide in enumerate(prs.slides):
        if i >= max_slides:
            break

        heading = ""
        body_parts = []
        table_parts = []

        # Extract title separately
        if slide.shapes.title and slide.shapes.title.has_text_frame:
            heading = slide.shapes.title.text_frame.text.strip()

        for shape in slide.shapes:
            # Skip title shape (already captured above)
            if shape == slide.shapes.title:
                continue

            # Text frames
            if shape.has_text_frame:
                for para in shape.text_frame.paragraphs:
                    para_text = para.text.strip()
                    if para_text:
                        # Detect heading-like paragraphs by font size or bold
                        is_large = any(
                            run.font.size and run.font.size.pt >= 20
                            for run in para.runs if run.font.size
                        )
                        is_bold = any(run.font.bold for run in para.runs)
                        prefix = "• " if para.level > 0 else ""
                        if is_large or is_bold and not heading:
                            heading = para_text
                        else:
                            body_parts.append(prefix + para_text)

            # Tables
            if shape.has_table:
                table = shape.table
                for row in table.rows:
                    cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if cells:
                        table_parts.append(" | ".join(cells))

        # Speaker notes
        notes_text = ""
        if slide.has_notes_slide:
            notes_text = slide.notes_slide.notes_text_frame.text.strip()

        slides.append(SlideContent(
            number=i + 1,
            heading=heading[:120] if heading else f"Slide {i + 1}",
            body="\n".join(body_parts),
            notes=notes_text[:500],  # cap notes length
            tables="\n".join(table_parts),
        ))

    return slides


# ─── Router ───────────────────────────────────────────────────────────────────

def parse_uploaded_file(filename: str, file_bytes: bytes, max_pages: int = 80) -> List[SlideContent]:
    """
    Detect file type from extension and dispatch to the right parser.
    Returns list of SlideContent objects.
    """
    ext = os.path.splitext(filename)[1].lower()

    if ext == ".pdf":
        return extract_pdf(file_bytes, max_pages)
    elif ext in (".pptx", ".ppt"):
        if ext == ".ppt":
            raise HTTPException(
                415,
                "Old .ppt format is not supported. Please save as .pptx (File → Save As → PowerPoint Presentation) and re-upload."
            )
        return extract_pptx(file_bytes, max_pages)
    else:
        raise HTTPException(
            415,
            f"Unsupported file type '{ext}'. Please upload a PDF (.pdf) or PowerPoint (.pptx) file."
        )


def build_content_string(slides: List[SlideContent], max_chars: int = 18000) -> str:
    """
    Concatenate all slides into a single content string for the GPT prompt.
    Truncates intelligently — keeps earlier slides (more foundational content) if over limit.
    """
    blocks = []
    total_chars = 0

    for slide in slides:
        block = slide.to_text_block()
        if total_chars + len(block) > max_chars:
            # Add partial note
            blocks.append(f"\n[...{len(slides) - slide.number + 1} more slides truncated to fit context window...]")
            break
        blocks.append(block)
        total_chars += len(block)

    return "\n\n---\n\n".join(blocks)