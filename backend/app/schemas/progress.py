from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CourseProgressBreakdown(BaseModel):
    submitted_weight: float
    in_progress_weight: float
    remaining_weight: float


class CourseProgressResponse(BaseModel):
    course_id: int
    course_code: str
    course_name: str
    progress: float  # 0.0 to 1.0
    breakdown: CourseProgressBreakdown
    total_assignments: int
    completed_assignments: int


class DueSoonItem(BaseModel):
    assignment_id: int
    title: str
    course_code: str
    due_at: datetime
    days_until_due: float
    weight: float
    status: str


class ProgressOverviewResponse(BaseModel):
    overall_progress: float
    total_courses: int
    tasks_completed: int
    tasks_in_progress: int
    tasks_not_started: int
    due_soon: List[DueSoonItem]
    reminders_due_count: int
    course_progress: List[CourseProgressResponse]


class TimelineWeekItem(BaseModel):
    week_number: int
    week_start: str  # ISO date
    week_end: str  # ISO date
    assignments_due: int
    workload_score: float  # sum of weights
    assignment_titles: List[str]


class TimelineResponse(BaseModel):
    weeks: List[TimelineWeekItem]
    total_weeks: int


class TrafficItem(BaseModel):
    assignment_id: int
    title: str
    course_code: str
    course_name: str
    due_at: datetime
    days_until_due: float
    weight: float
    status: str
    traffic_score: float
    is_clustered: bool
    rationale: str


class TrafficResponse(BaseModel):
    traffic_items: List[TrafficItem]
    total_count: int


class RerouteSuggestion(BaseModel):
    priority: int  # 1 = highest
    action: str
    assignment_id: int
    assignment_title: str
    course_code: str
    rationale: str
    suggested_start_at: Optional[datetime]
    due_at: datetime
    days_until_due: float
    difficulty: Optional[str]
    planned_hours: Optional[float]


class RerouteResponse(BaseModel):
    suggestions: List[RerouteSuggestion]
    total_count: int
