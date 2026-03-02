from __future__ import annotations
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class Course(SQLModel, table=True):
    __tablename__ = "courses"
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(index=True)        # e.g. SC2006
    name: str
    term: str = "Y2S2"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CourseOutline(SQLModel, table=True):
    __tablename__ = "course_outlines"
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(index=True)
    description: str = ""
    instructor: str = ""
    last_updated_at: datetime = Field(default_factory=datetime.utcnow)


class CourseComponent(SQLModel, table=True):
    """
    Weightage breakdown:
      - Final Exam 40%
      - Project 30%
      - Quizzes 10%
    """
    __tablename__ = "course_components"
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(index=True)
    name: str
    weight: float = 0.0  # 0..1
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TopicNode(SQLModel, table=True):
    """
    Topic hierarchy (tree):
      parent_id None => root topic
    """
    __tablename__ = "topic_nodes"
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(index=True)
    parent_id: Optional[int] = Field(default=None, index=True)
    title: str
    order_index: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Assignment(SQLModel, table=True):
    __tablename__ = "assignments"
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(index=True)
    title: str
    description: str = ""
    due_at: datetime
    weight: float = 0.0
    status: str = "not_started"  # not_started | in_progress | submitted
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Reminder(SQLModel, table=True):
    __tablename__ = "reminders"
    id: Optional[int] = Field(default=None, primary_key=True)
    assignment_id: int = Field(index=True)
    remind_at: datetime
    channel: str = "in_app"      # in_app | email | teams (future)
    message: str
    status: str = "scheduled"    # scheduled | sent | cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AssignmentWorkPlan(SQLModel, table=True):
    __tablename__ = "assignment_work_plans"
    id: Optional[int] = Field(default=None, primary_key=True)
    assignment_id: int = Field(index=True)
    suggested_start_at: datetime
    planned_hours: float = 6.0
    difficulty: str = "medium"   # easy | medium | hard
    rationale: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GeneratedDocument(SQLModel, table=True):
    __tablename__ = "generated_documents"
    id: Optional[int] = Field(default=None, primary_key=True)
    assignment_id: int = Field(index=True)
    doc_type: str                # word | ppt
    file_name: str
    file_path: str
    created_at: datetime = Field(default_factory=datetime.utcnow)