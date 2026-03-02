from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class CourseCreate(BaseModel):
    name: str
    term: str = "Y2S2"

class CheckpointCreate(BaseModel):
    title: str
    kind: str
    due_at: datetime
    weight: float = 0.0

class StudyEventCreate(BaseModel):
    topic: str
    minutes: int

class QuizAttemptCreate(BaseModel):
    topic: str
    correct: int
    total: int
    time_taken_sec: int

class SubmissionCreate(BaseModel):
    title: str
    due_at: datetime

class AgentMessage(BaseModel):
    course_id: Optional[int] = None
    page: str  # "Course", "Tracking", etc.
    message: str

class QuizGenRequest(BaseModel):
    course_id: int
    n: int = 8
    focus_topics: List[str] = []