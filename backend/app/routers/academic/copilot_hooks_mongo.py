from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from app.db.mongodb import get_course, list_assignments, create_assignment
from app.services.ai.openai_key import get_ai_client

router = APIRouter(prefix="/academic/copilot", tags=["academic-copilot-hooks"])


class DraftHookRequest(BaseModel):
    course_code: str
    assignment_title: str
    description: Optional[str] = None
    due_at: Optional[str] = None
    weight: float = 0.1


class SuggestionHookRequest(BaseModel):
    context: Optional[str] = None


@router.post("/draft_assignment")
async def draft_assignment(body: DraftHookRequest):
    """Draft an assignment using AI."""
    course = get_course(body.course_code)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Generate description if not provided
    description = body.description
    if not description:
        try:
            client = get_ai_client()
            response = await client.chat.completions.create(
                model="gpt-4.1",
                messages=[
                    {"role": "system", "content": "You are an academic assistant. Generate a brief assignment description."},
                    {"role": "user", "content": f"Create a brief description for an assignment titled '{body.assignment_title}' in the course '{course['name']}' ({course['code']})."}
                ],
                max_tokens=200
            )
            description = response.choices[0].message.content
        except:
            description = f"Assignment for {course['name']}"
    
    # Parse due date or default to 2 weeks from now
    due_at = datetime.utcnow() + timedelta(weeks=2)
    if body.due_at:
        try:
            due_at = datetime.fromisoformat(body.due_at.replace("Z", "+00:00"))
        except:
            pass
    
    # Create the assignment
    assignment = create_assignment(
        course_code=body.course_code,
        title=body.assignment_title,
        description=description,
        due_at=due_at,
        weight=body.weight
    )
    
    return {
        "message": "Assignment drafted successfully",
        "assignment": assignment
    }


@router.post("/assignment_suggestions/{course_code}")
async def assignment_suggestions(course_code: str, body: SuggestionHookRequest):
    """Get AI-powered suggestions for assignments in a course."""
    course = get_course(course_code)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    existing = list_assignments(course_code)
    existing_titles = [a["title"] for a in existing]
    
    try:
        client = get_ai_client()
        context = body.context if body.context else ""
        
        prompt = f"""Course: {course['name']} ({course['code']})
Existing assignments: {', '.join(existing_titles) if existing_titles else 'None'}
{f'Additional context: {context}' if context else ''}

Suggest 3-5 new assignment ideas for this course. For each, provide:
1. A title
2. A brief description
3. Suggested weight (as a decimal, e.g., 0.1 for 10%)
4. Suggested due date offset (e.g., "2 weeks", "1 month")

Format as a JSON array."""

        response = await client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": "You are an academic assistant that helps create course assignments."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=800
        )
        
        suggestions_text = response.choices[0].message.content
        
        return {
            "course": course,
            "existing_assignments": len(existing),
            "suggestions": suggestions_text
        }
    except Exception as e:
        return {
            "course": course,
            "existing_assignments": len(existing),
            "suggestions": [
                {"title": "Midterm Project", "description": "A project covering first half topics", "weight": 0.2},
                {"title": "Final Presentation", "description": "Present your research findings", "weight": 0.15},
                {"title": "Weekly Quizzes", "description": "Regular knowledge checks", "weight": 0.1}
            ],
            "error": str(e)
        }
