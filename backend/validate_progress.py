#!/usr/bin/env python3
"""
Quick validation script for Progress Analytics Module
Run this to seed test data and validate endpoints work correctly.
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.db.session import engine
from app.db.init_db import init_db
from app.models.academic import Course, Assignment, AssignmentWorkPlan
from app.services.academic.progress_engine import (
    compute_course_progress,
    compute_semester_overview,
    compute_timeline,
    compute_traffic,
    compute_reroute,
)


def seed_test_data(session: Session):
    """Seed database with test data."""
    print("🌱 Seeding test data...")
    
    # Create courses
    courses = [
        Course(code="CS301", name="Data Structures", term="Y2S2"),
        Course(code="CS302", name="Algorithms", term="Y2S2"),
        Course(code="CS303", name="Databases", term="Y2S2"),
    ]
    for c in courses:
        session.add(c)
    session.commit()
    
    # Refresh to get IDs
    for c in courses:
        session.refresh(c)
    
    # Create assignments with various statuses
    now = datetime.utcnow()
    assignments = [
        # CS301 - Mixed progress
        Assignment(
            course_id=courses[0].id,
            title="Binary Trees Assignment",
            due_at=now + timedelta(days=3),
            weight=0.25,
            status="submitted",
        ),
        Assignment(
            course_id=courses[0].id,
            title="Sorting Algorithms Lab",
            due_at=now + timedelta(days=7),
            weight=0.25,
            status="in_progress",
        ),
        Assignment(
            course_id=courses[0].id,
            title="Final Project",
            due_at=now + timedelta(days=25),
            weight=0.50,
            status="not_started",
        ),
        # CS302 - Urgent work needed
        Assignment(
            course_id=courses[1].id,
            title="Graph Algorithms",
            due_at=now + timedelta(days=2),
            weight=0.40,
            status="not_started",
        ),
        Assignment(
            course_id=courses[1].id,
            title="Dynamic Programming",
            due_at=now + timedelta(days=15),
            weight=0.60,
            status="not_started",
        ),
        # CS303 - On track
        Assignment(
            course_id=courses[2].id,
            title="SQL Queries Assignment",
            due_at=now + timedelta(days=10),
            weight=0.30,
            status="in_progress",
        ),
        Assignment(
            course_id=courses[2].id,
            title="Database Design Project",
            due_at=now + timedelta(days=30),
            weight=0.70,
            status="not_started",
        ),
    ]
    
    for a in assignments:
        session.add(a)
    session.commit()
    
    # Refresh assignments to get IDs
    for a in assignments:
        session.refresh(a)
    
    # Add work plans for some assignments
    work_plans = [
        AssignmentWorkPlan(
            assignment_id=assignments[2].id,  # Final Project
            suggested_start_at=now + timedelta(days=10),
            planned_hours=20.0,
            difficulty="hard",
            rationale="Large project requiring significant time",
        ),
        AssignmentWorkPlan(
            assignment_id=assignments[3].id,  # Graph Algorithms
            suggested_start_at=now - timedelta(days=1),  # Should have started!
            planned_hours=8.0,
            difficulty="medium",
            rationale="Start immediately - deadline approaching",
        ),
    ]
    
    for wp in work_plans:
        session.add(wp)
    session.commit()
    
    print("✅ Test data seeded successfully")
    return courses, assignments


def validate_endpoints(session: Session, courses: list):
    """Validate all progress endpoints return data."""
    print("\n🔍 Validating endpoints...\n")
    
    # Test 1: Overview
    print("1️⃣  Testing /overview...")
    overview = compute_semester_overview(session)
    assert overview.total_courses == 3, f"Expected 3 courses, got {overview.total_courses}"
    assert overview.overall_progress > 0, "Overall progress should be > 0"
    print(f"   ✅ Overview: {overview.total_courses} courses, {overview.overall_progress:.1%} complete")
    print(f"   📊 Tasks: {overview.tasks_completed} done, {overview.tasks_in_progress} in progress, {overview.tasks_not_started} pending")
    
    # Test 2: Course Progress
    print("\n2️⃣  Testing /courses/{course_id}...")
    for course in courses[:2]:  # Test first 2 courses
        progress = compute_course_progress(session, course.id)
        print(f"   ✅ {progress.course_code}: {progress.progress:.1%} complete")
        print(f"      Breakdown: {progress.breakdown.submitted_weight:.2f} submitted, "
              f"{progress.breakdown.in_progress_weight:.2f} in progress, "
              f"{progress.breakdown.remaining_weight:.2f} remaining")
    
    # Test 3: Timeline
    print("\n3️⃣  Testing /timeline...")
    timeline = compute_timeline(session, weeks=4)
    assert timeline.total_weeks == 4, "Should return 4 weeks"
    busy_weeks = [w for w in timeline.weeks if w.assignments_due > 0]
    print(f"   ✅ Timeline: {len(busy_weeks)} weeks with assignments")
    for week in timeline.weeks[:3]:
        if week.assignments_due > 0:
            print(f"      Week {week.week_number}: {week.assignments_due} assignments, workload {week.workload_score:.2f}")
    
    # Test 4: Traffic
    print("\n4️⃣  Testing /traffic...")
    traffic = compute_traffic(session, limit=5)
    assert len(traffic.traffic_items) > 0, "Should have traffic items"
    print(f"   ✅ Traffic: {traffic.total_count} risky assignments found")
    for i, item in enumerate(traffic.traffic_items[:3], 1):
        print(f"      {i}. {item.course_code} - {item.title}")
        print(f"         Due in {item.days_until_due:.1f} days | Score: {item.traffic_score:.2f}")
        print(f"         Status: {item.status} | {item.rationale}")
    
    # Test 5: Reroute
    print("\n5️⃣  Testing /reroute...")
    reroute = compute_reroute(session, limit=5)
    assert len(reroute.suggestions) > 0, "Should have suggestions"
    print(f"   ✅ Reroute: {reroute.total_count} suggestions generated")
    for sug in reroute.suggestions[:3]:
        print(f"      Priority {sug.priority}: {sug.action}")
        print(f"         {sug.rationale}")
    
    print("\n✅ All endpoint validations passed!")


def main():
    """Main validation routine."""
    print("=" * 60)
    print("Progress Analytics Module - Validation Script")
    print("=" * 60)
    
    # Initialize database
    print("\n📦 Initializing database...")
    init_db()
    print("✅ Database initialized")
    
    # Create session and seed data
    with Session(engine) as session:
        # Clear existing test data if any
        session.exec(select(AssignmentWorkPlan)).all()
        session.exec(select(Assignment)).all()
        session.exec(select(Course)).all()
        
        courses, assignments = seed_test_data(session)
        validate_endpoints(session, courses)
    
    print("\n" + "=" * 60)
    print("🎉 Validation Complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Start server: uvicorn app.main:app --reload")
    print("2. Open API docs: http://127.0.0.1:8000/docs")
    print("3. Test progress endpoints under 'academic-progress' tag")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Validation failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
