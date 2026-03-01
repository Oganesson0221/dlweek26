from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class Course(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    term: str = "Y2S2"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CourseComponent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(index=True)
    name: str  # "Final Exam", "Project", etc.
    weight: float = 0.0  # 0..1

class Checkpoint(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(index=True)
    title: str
    kind: str  # quiz | assignment | midterm | final
    due_at: datetime
    weight: float = 0.0
    status: str = "pending"  # pending | done

class StudyEvent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(index=True)
    topic: str
    minutes: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class QuizAttempt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(index=True)
    topic: str
    correct: int
    total: int
    time_taken_sec: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Submission(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(index=True)
    title: str
    due_at: datetime
    status: str = "not_started"  # not_started | in_progress | submitted
    notes: str = ""

class UploadDoc(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(index=True)
    filename: str
    doc_type: str = "slides"  # slides | notes | assignment
    stored_path: str
    created_at: datetime = Field(default_factory=datetime.utcnow)