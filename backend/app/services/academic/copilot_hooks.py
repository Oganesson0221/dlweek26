from sqlmodel import Session, select
from ...models.academic import Assignment, Course


def draft_hook(session: Session, assignment_id: int, prompt: str) -> dict:
    a = session.exec(select(Assignment).where(Assignment.id == assignment_id)).first()
    if a is None:
        raise ValueError("assignment_not_found")

    c = session.exec(select(Course).where(Course.id == a.course_id)).first()

    return {
        "assignment_id": assignment_id,
        "course": f"{c.code} {c.name}" if c else "Unknown",
        "assignment_title": a.title,
        "prompt": prompt,
        "draft_outline": [
            {"section": "Introduction", "hint": "Context + objective"},
            {"section": "Method", "hint": "Steps + tools"},
            {"section": "Results", "hint": "Tables + graphs"},
            {"section": "Discussion", "hint": "Interpretation + limits"},
            {"section": "Conclusion", "hint": "Summary + next steps"},
        ],
        "clippy_line": "Want me to generate a Word template for you?"
    }


def suggestion_hook(session: Session, course_id: int, prompt: str) -> dict:
    return {
        "course_id": course_id,
        "prompt": prompt,
        "suggestions": [
            "Create your template first, then fill headings.",
            "Work backward from the deadline and set mini-milestones.",
            "Draft Introduction + Methodology before polishing visuals.",
        ]
    }