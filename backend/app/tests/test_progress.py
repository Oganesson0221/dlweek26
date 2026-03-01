import pytest
from datetime import datetime, timedelta
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.models.academic import Course, Assignment, AssignmentWorkPlan
from app.services.academic.progress_engine import (
    compute_course_progress,
    compute_semester_overview,
    compute_timeline,
    compute_traffic,
    compute_reroute,
)


@pytest.fixture(name="session")
def session_fixture():
    """Create in-memory SQLite database for testing."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        yield session


def test_course_progress_basic(session: Session):
    """Test basic course progress calculation."""
    # Create a course
    course = Course(code="CS101", name="Intro to CS", term="Y2S2")
    session.add(course)
    session.commit()
    session.refresh(course)

    # Create assignments with different statuses
    now = datetime.utcnow()
    assignments = [
        Assignment(
            course_id=course.id,
            title="HW1",
            due_at=now + timedelta(days=7),
            weight=0.2,
            status="submitted",
        ),
        Assignment(
            course_id=course.id,
            title="HW2",
            due_at=now + timedelta(days=14),
            weight=0.3,
            status="in_progress",
        ),
        Assignment(
            course_id=course.id,
            title="Project",
            due_at=now + timedelta(days=30),
            weight=0.5,
            status="not_started",
        ),
    ]
    for a in assignments:
        session.add(a)
    session.commit()

    # Compute progress
    result = compute_course_progress(session, course.id)

    # Assertions
    assert result.course_id == course.id
    assert result.course_code == "CS101"
    assert result.total_assignments == 3
    assert result.completed_assignments == 1

    # Expected: (1.0*0.2 + 0.5*0.3 + 0.0*0.5) / 1.0 = 0.35
    assert result.progress == pytest.approx(0.35, rel=0.01)
    assert result.breakdown.submitted_weight == 0.2
    assert result.breakdown.in_progress_weight == 0.3
    assert result.breakdown.remaining_weight == 0.5


def test_semester_overview(session: Session):
    """Test semester-wide overview calculation."""
    # Create 2 courses
    course1 = Course(code="CS101", name="Intro to CS", term="Y2S2")
    course2 = Course(code="CS201", name="Data Structures", term="Y2S2")
    session.add(course1)
    session.add(course2)
    session.commit()
    session.refresh(course1)
    session.refresh(course2)

    # Create assignments
    now = datetime.utcnow()
    assignments = [
        Assignment(
            course_id=course1.id,
            title="HW1",
            due_at=now + timedelta(days=2),
            weight=0.5,
            status="submitted",
        ),
        Assignment(
            course_id=course1.id,
            title="HW2",
            due_at=now + timedelta(days=5),
            weight=0.5,
            status="in_progress",
        ),
        Assignment(
            course_id=course2.id,
            title="Project",
            due_at=now + timedelta(days=20),
            weight=1.0,
            status="not_started",
        ),
    ]
    for a in assignments:
        session.add(a)
    session.commit()

    # Compute overview
    result = compute_semester_overview(session)

    # Assertions
    assert result.total_courses == 2
    assert result.tasks_completed == 1
    assert result.tasks_in_progress == 1
    assert result.tasks_not_started == 1
    assert len(result.due_soon) == 2  # 2 assignments due within 7 days
    assert len(result.course_progress) == 2


def test_timeline_weekly_workload(session: Session):
    """Test weekly timeline workload calculation."""
    # Create a course
    course = Course(code="CS101", name="Intro to CS", term="Y2S2")
    session.add(course)
    session.commit()
    session.refresh(course)

    # Create assignments across different weeks
    now = datetime.utcnow()
    assignments = [
        Assignment(
            course_id=course.id,
            title="HW1",
            due_at=now + timedelta(days=3),
            weight=0.2,
            status="not_started",
        ),
        Assignment(
            course_id=course.id,
            title="HW2",
            due_at=now + timedelta(days=5),
            weight=0.3,
            status="not_started",
        ),
        Assignment(
            course_id=course.id,
            title="Project",
            due_at=now + timedelta(days=15),
            weight=0.5,
            status="not_started",
        ),
    ]
    for a in assignments:
        session.add(a)
    session.commit()

    # Compute timeline
    result = compute_timeline(session, weeks=4)

    # Assertions
    assert result.total_weeks == 4
    assert len(result.weeks) == 4
    # Week 1 should have 2 assignments (0.2 + 0.3 = 0.5 workload)
    assert result.weeks[0].assignments_due == 2
    assert result.weeks[0].workload_score == pytest.approx(0.5, rel=0.01)


def test_traffic_scoring(session: Session):
    """Test traffic scoring prioritizes urgent, high-weight, not-started items."""
    # Create a course
    course = Course(code="CS101", name="Intro to CS", term="Y2S2")
    session.add(course)
    session.commit()
    session.refresh(course)

    # Create assignments with varying urgency and status
    now = datetime.utcnow()
    assignments = [
        Assignment(
            course_id=course.id,
            title="Very Urgent",
            due_at=now + timedelta(days=1),
            weight=0.4,
            status="not_started",
        ),
        Assignment(
            course_id=course.id,
            title="Low Priority",
            due_at=now + timedelta(days=30),
            weight=0.1,
            status="not_started",
        ),
        Assignment(
            course_id=course.id,
            title="Already Done",
            due_at=now + timedelta(days=2),
            weight=0.5,
            status="submitted",
        ),
    ]
    for a in assignments:
        session.add(a)
    session.commit()

    # Compute traffic
    result = compute_traffic(session, limit=5)

    # Assertions
    assert len(result.traffic_items) >= 1
    # Most urgent item should be first
    assert result.traffic_items[0].title == "Very Urgent"
    assert result.traffic_items[0].traffic_score > 0


def test_reroute_suggestions(session: Session):
    """Test reroute suggestions prioritize correctly."""
    # Create a course
    course = Course(code="CS101", name="Intro to CS", term="Y2S2")
    session.add(course)
    session.commit()
    session.refresh(course)

    # Create assignments
    now = datetime.utcnow()
    a1 = Assignment(
        course_id=course.id,
        title="Urgent Task",
        due_at=now + timedelta(days=2),
        weight=0.5,
        status="not_started",
    )
    a2 = Assignment(
        course_id=course.id,
        title="In Progress Task",
        due_at=now + timedelta(days=5),
        weight=0.3,
        status="in_progress",
    )
    session.add(a1)
    session.add(a2)
    session.commit()
    session.refresh(a1)
    session.refresh(a2)

    # Add work plan for a1
    wp = AssignmentWorkPlan(
        assignment_id=a1.id,
        suggested_start_at=now - timedelta(days=1),  # Should have started yesterday
        planned_hours=8.0,
        difficulty="hard",
        rationale="Test",
    )
    session.add(wp)
    session.commit()

    # Compute reroute
    result = compute_reroute(session, limit=5)

    # Assertions
    assert len(result.suggestions) >= 2
    # First suggestion should have priority 1
    assert result.suggestions[0].priority == 1
    # Should suggest starting the urgent task
    assert "START" in result.suggestions[0].action.upper() or "URGENT" in result.suggestions[0].action.upper()


def test_empty_course_progress(session: Session):
    """Test progress calculation for course with no assignments."""
    course = Course(code="CS101", name="Intro to CS", term="Y2S2")
    session.add(course)
    session.commit()
    session.refresh(course)

    result = compute_course_progress(session, course.id)

    assert result.progress == 0.0
    assert result.total_assignments == 0
    assert result.completed_assignments == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
