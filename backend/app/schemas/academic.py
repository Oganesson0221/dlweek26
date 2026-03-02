from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class CourseCreate(BaseModel):
    code: str
    name: str
    term: str = "Y2S2"


class OutlineUpsert(BaseModel):
    description: str = ""
    instructor: str = ""


class ComponentItem(BaseModel):
    name: str
    weight: float  # 0..1


class TopicCreate(BaseModel):
    parent_id: Optional[int] = None
    title: str
    order_index: int = 0


class AssignmentCreate(BaseModel):
    title: str
    description: str = ""
    due_at: datetime
    weight: float = 0.0


class AssignmentStatusUpdate(BaseModel):
    status: str  # not_started | in_progress | submitted


class ConflictQuery(BaseModel):
    window_hours: int = 48


class StartDateSuggestRequest(BaseModel):
    assignment_id: int
    planned_hours: float = 6.0
    difficulty: str = "medium"


class TemplateGenRequest(BaseModel):
    assignment_id: str  # Changed to str to support MongoDB ObjectId


class DraftHookRequest(BaseModel):
    assignment_id: int
    prompt: str = "Draft an outline and key sections."


class SuggestionHookRequest(BaseModel):
    course_id: int
    prompt: str = "What should I do next?"