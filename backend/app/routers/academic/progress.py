from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from app.db.session import get_session
from app.schemas.progress import (
    ProgressOverviewResponse,
    CourseProgressResponse,
    TimelineResponse,
    TrafficResponse,
    RerouteResponse,
)
from app.services.academic.progress_engine import (
    compute_semester_overview,
    compute_course_progress,
    compute_timeline,
    compute_traffic,
    compute_reroute,
)

router = APIRouter(prefix="/academic/progress", tags=["academic-progress"])


@router.get("/overview", response_model=ProgressOverviewResponse)
def get_overview(session: Session = Depends(get_session)):
    """
    Get semester-wide overview including:
    - Overall progress across all courses
    - Task counts by status
    - Due soon items (next 7 days)
    - Per-course progress breakdown
    """
    return compute_semester_overview(session)


@router.get("/courses/{course_id}", response_model=CourseProgressResponse)
def get_course_progress(course_id: int, session: Session = Depends(get_session)):
    """
    Get detailed progress for a specific course:
    - Weighted completion percentage
    - Breakdown by status (submitted/in-progress/remaining)
    - Assignment counts
    """
    return compute_course_progress(session, course_id)


@router.get("/timeline", response_model=TimelineResponse)
def get_timeline(
    weeks: int = Query(default=8, ge=1, le=52),
    session: Session = Depends(get_session),
):
    """
    Get weekly workload timeline:
    - Assignments due per week
    - Workload score (sum of weights)
    - Assignment titles for each week
    """
    return compute_timeline(session, weeks)


@router.get("/traffic", response_model=TrafficResponse)
def get_traffic(
    limit: int = Query(default=5, ge=1, le=20),
    session: Session = Depends(get_session),
):
    """
    Get highest risk assignments (traffic):
    - Based on urgency, weight, status, and deadline clusters
    - Returns top items sorted by traffic score
    """
    return compute_traffic(session, limit)


@router.get("/reroute", response_model=RerouteResponse)
def get_reroute(
    limit: int = Query(default=5, ge=1, le=20),
    session: Session = Depends(get_session),
):
    """
    Get prioritized next action suggestions:
    - Based on work plans, due dates, and current status
    - Deterministic logic (no LLM required)
    - Returns actionable items sorted by priority
    """
    return compute_reroute(session, limit)
