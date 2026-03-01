from datetime import datetime, timedelta
from sqlmodel import Session, select
from ...models.academic import (
    Course,
    Assignment,
    Reminder,
    AssignmentWorkPlan,
    CourseComponent,
)
from ...schemas.progress import (
    CourseProgressResponse,
    CourseProgressBreakdown,
    ProgressOverviewResponse,
    DueSoonItem,
    TimelineWeekItem,
    TimelineResponse,
    TrafficItem,
    TrafficResponse,
    RerouteSuggestion,
    RerouteResponse,
)


# Status scoring for progress calculation
STATUS_SCORES = {
    "not_started": 0.0,
    "in_progress": 0.5,
    "submitted": 1.0,
}


def compute_course_progress(session: Session, course_id: int) -> CourseProgressResponse:
    """Compute weighted progress for a single course based on assignments."""
    course = session.exec(select(Course).where(Course.id == course_id)).first()
    if course is None:
        raise ValueError("course_not_found")

    assignments = session.exec(
        select(Assignment).where(Assignment.course_id == course_id)
    ).all()

    if not assignments:
        return CourseProgressResponse(
            course_id=course_id,
            course_code=course.code,
            course_name=course.name,
            progress=0.0,
            breakdown=CourseProgressBreakdown(
                submitted_weight=0.0, in_progress_weight=0.0, remaining_weight=0.0
            ),
            total_assignments=0,
            completed_assignments=0,
        )

    total_weight = sum(a.weight for a in assignments)
    if total_weight == 0:
        total_weight = len(assignments)  # Equal weight if not specified

    submitted_weight = 0.0
    in_progress_weight = 0.0
    completed_count = 0

    for assignment in assignments:
        weight = assignment.weight if assignment.weight > 0 else 1.0
        status_score = STATUS_SCORES.get(assignment.status, 0.0)

        if assignment.status == "submitted":
            submitted_weight += weight
            completed_count += 1
        elif assignment.status == "in_progress":
            in_progress_weight += weight

    remaining_weight = total_weight - submitted_weight - in_progress_weight

    # Weighted completion progress
    weighted_completion = 0.0
    for assignment in assignments:
        weight = assignment.weight if assignment.weight > 0 else 1.0
        status_score = STATUS_SCORES.get(assignment.status, 0.0)
        weighted_completion += status_score * weight

    progress = weighted_completion / total_weight if total_weight > 0 else 0.0

    return CourseProgressResponse(
        course_id=course_id,
        course_code=course.code,
        course_name=course.name,
        progress=round(progress, 3),
        breakdown=CourseProgressBreakdown(
            submitted_weight=round(submitted_weight, 2),
            in_progress_weight=round(in_progress_weight, 2),
            remaining_weight=round(remaining_weight, 2),
        ),
        total_assignments=len(assignments),
        completed_assignments=completed_count,
    )


def compute_semester_overview(session: Session) -> ProgressOverviewResponse:
    """Aggregate progress across all courses."""
    courses = session.exec(select(Course)).all()
    all_assignments = session.exec(select(Assignment)).all()

    # Compute per-course progress
    course_progress_list = []
    total_progress = 0.0
    valid_courses = 0

    for course in courses:
        try:
            cp = compute_course_progress(session, course.id)
            course_progress_list.append(cp)
            if cp.total_assignments > 0:
                total_progress += cp.progress
                valid_courses += 1
        except ValueError:
            continue

    overall_progress = (
        total_progress / valid_courses if valid_courses > 0 else 0.0
    )

    # Count task statuses
    tasks_completed = sum(1 for a in all_assignments if a.status == "submitted")
    tasks_in_progress = sum(1 for a in all_assignments if a.status == "in_progress")
    tasks_not_started = sum(1 for a in all_assignments if a.status == "not_started")

    # Due soon (next 7 days)
    now = datetime.utcnow()
    seven_days_later = now + timedelta(days=7)
    due_soon_assignments = [
        a for a in all_assignments if now <= a.due_at <= seven_days_later
    ]
    due_soon_assignments.sort(key=lambda a: a.due_at)

    due_soon_items = []
    for a in due_soon_assignments[:10]:  # Limit to 10
        course = session.exec(select(Course).where(Course.id == a.course_id)).first()
        days_until = (a.due_at - now).total_seconds() / 86400
        due_soon_items.append(
            DueSoonItem(
                assignment_id=a.id,
                title=a.title,
                course_code=course.code if course else "N/A",
                due_at=a.due_at,
                days_until_due=round(days_until, 2),
                weight=a.weight,
                status=a.status,
            )
        )

    # Count reminders due now
    reminders_due = session.exec(
        select(Reminder)
        .where(Reminder.status == "scheduled")
        .where(Reminder.remind_at <= now)
    ).all()

    return ProgressOverviewResponse(
        overall_progress=round(overall_progress, 3),
        total_courses=len(courses),
        tasks_completed=tasks_completed,
        tasks_in_progress=tasks_in_progress,
        tasks_not_started=tasks_not_started,
        due_soon=due_soon_items,
        reminders_due_count=len(reminders_due),
        course_progress=course_progress_list,
    )


def compute_timeline(session: Session, weeks: int = 8) -> TimelineResponse:
    """Return weekly workload aggregation."""
    now = datetime.utcnow()
    all_assignments = session.exec(select(Assignment)).all()

    # Create week buckets
    timeline_weeks = []
    for week_offset in range(weeks):
        week_start = now + timedelta(weeks=week_offset)
        week_end = week_start + timedelta(days=7)

        # Find assignments due in this week
        week_assignments = [
            a for a in all_assignments if week_start <= a.due_at < week_end
        ]

        workload_score = sum(
            a.weight if a.weight > 0 else 1.0 for a in week_assignments
        )
        assignment_titles = [a.title for a in week_assignments]

        timeline_weeks.append(
            TimelineWeekItem(
                week_number=week_offset + 1,
                week_start=week_start.strftime("%Y-%m-%d"),
                week_end=week_end.strftime("%Y-%m-%d"),
                assignments_due=len(week_assignments),
                workload_score=round(workload_score, 2),
                assignment_titles=assignment_titles,
            )
        )

    return TimelineResponse(weeks=timeline_weeks, total_weeks=weeks)


def compute_traffic(session: Session, limit: int = 5) -> TrafficResponse:
    """Compute top risky assignments based on urgency, weight, and status."""
    now = datetime.utcnow()
    all_assignments = session.exec(select(Assignment)).all()

    # Filter: only assignments that are not submitted and are due in future
    active_assignments = [
        a for a in all_assignments if a.status != "submitted" and a.due_at >= now
    ]

    # Detect clusters (assignments within 48 hours of each other)
    clustered_ids = set()
    cluster_window = timedelta(hours=48)
    for i, a1 in enumerate(active_assignments):
        for a2 in active_assignments[i + 1 :]:
            if abs((a2.due_at - a1.due_at).total_seconds()) <= cluster_window.total_seconds():
                if a1.course_id != a2.course_id:
                    clustered_ids.add(a1.id)
                    clustered_ids.add(a2.id)

    # Compute traffic scores
    traffic_items = []
    for a in active_assignments:
        days_until = (a.due_at - now).total_seconds() / 86400
        urgency = 1.0 / (days_until + 1)  # Higher urgency as due date approaches
        status_penalty = 1.0 - STATUS_SCORES.get(a.status, 0.0)
        weight = a.weight if a.weight > 0 else 1.0

        cluster_bonus = 2.0 if a.id in clustered_ids else 0.0
        traffic_score = (urgency * weight * status_penalty) + cluster_bonus

        course = session.exec(select(Course).where(Course.id == a.course_id)).first()

        rationale_parts = []
        if days_until < 3:
            rationale_parts.append(f"Due in {days_until:.1f} days")
        if a.status == "not_started":
            rationale_parts.append("Not yet started")
        if weight > 0.2:
            rationale_parts.append(f"High weight ({weight:.0%})")
        if a.id in clustered_ids:
            rationale_parts.append("Deadline cluster detected")

        traffic_items.append(
            TrafficItem(
                assignment_id=a.id,
                title=a.title,
                course_code=course.code if course else "N/A",
                course_name=course.name if course else "N/A",
                due_at=a.due_at,
                days_until_due=round(days_until, 2),
                weight=weight,
                status=a.status,
                traffic_score=round(traffic_score, 3),
                is_clustered=a.id in clustered_ids,
                rationale="; ".join(rationale_parts) if rationale_parts else "Due soon",
            )
        )

    # Sort by traffic score descending
    traffic_items.sort(key=lambda x: x.traffic_score, reverse=True)

    return TrafficResponse(
        traffic_items=traffic_items[:limit], total_count=len(traffic_items)
    )


def compute_reroute(session: Session, limit: int = 5) -> RerouteResponse:
    """Generate prioritized next action suggestions based on work plans and deadlines."""
    now = datetime.utcnow()
    all_assignments = session.exec(select(Assignment)).all()

    # Filter active assignments (not submitted)
    active_assignments = [a for a in all_assignments if a.status != "submitted"]

    suggestions = []
    for a in active_assignments:
        course = session.exec(select(Course).where(Course.id == a.course_id)).first()
        work_plan = session.exec(
            select(AssignmentWorkPlan).where(AssignmentWorkPlan.assignment_id == a.id)
        ).first()

        days_until = (a.due_at - now).total_seconds() / 86400

        # Determine action based on status and work plan
        action = ""
        rationale_parts = []

        if work_plan:
            days_until_start = (work_plan.suggested_start_at - now).total_seconds() / 86400

            if a.status == "not_started":
                if days_until_start <= 0:
                    action = f"🚨 START NOW: {a.title}"
                    rationale_parts.append(
                        f"Suggested start date has passed ({abs(days_until_start):.1f} days overdue)"
                    )
                else:
                    action = f"📅 Prepare to start: {a.title}"
                    rationale_parts.append(f"Start in {days_until_start:.1f} days")

                if work_plan.difficulty:
                    rationale_parts.append(f"Difficulty: {work_plan.difficulty}")
                if work_plan.planned_hours:
                    rationale_parts.append(f"{work_plan.planned_hours}h planned")

            elif a.status == "in_progress":
                action = f"⚡ Continue: {a.title}"
                rationale_parts.append(f"Due in {days_until:.1f} days")
                if work_plan.planned_hours:
                    rationale_parts.append(f"{work_plan.planned_hours}h total")

        else:
            # No work plan exists
            if a.status == "not_started":
                if days_until < 3:
                    action = f"🚨 URGENT: Start {a.title}"
                    rationale_parts.append(f"Due in {days_until:.1f} days, no plan yet")
                else:
                    action = f"📋 Plan + Start: {a.title}"
                    rationale_parts.append(f"Create work plan (due in {days_until:.1f} days)")
            elif a.status == "in_progress":
                action = f"⚡ Finish: {a.title}"
                rationale_parts.append(f"Due in {days_until:.1f} days")

        # Calculate priority score (lower = higher priority)
        priority_score = days_until
        if a.status == "in_progress":
            priority_score -= 1  # Prioritize in-progress items
        if work_plan and work_plan.difficulty == "hard":
            priority_score -= 2
        if a.weight > 0.2:
            priority_score -= (a.weight * 5)  # Weight factor

        suggestions.append(
            {
                "priority_score": priority_score,
                "suggestion": RerouteSuggestion(
                    priority=0,  # Will be set after sorting
                    action=action,
                    assignment_id=a.id,
                    assignment_title=a.title,
                    course_code=course.code if course else "N/A",
                    rationale="; ".join(rationale_parts),
                    suggested_start_at=work_plan.suggested_start_at if work_plan else None,
                    due_at=a.due_at,
                    days_until_due=round(days_until, 2),
                    difficulty=work_plan.difficulty if work_plan else None,
                    planned_hours=work_plan.planned_hours if work_plan else None,
                ),
            }
        )

    # Sort by priority score (ascending = highest priority first)
    suggestions.sort(key=lambda x: x["priority_score"])

    # Assign priority numbers
    final_suggestions = []
    for idx, item in enumerate(suggestions[:limit]):
        item["suggestion"].priority = idx + 1
        final_suggestions.append(item["suggestion"])

    return RerouteResponse(
        suggestions=final_suggestions, total_count=len(suggestions)
    )
