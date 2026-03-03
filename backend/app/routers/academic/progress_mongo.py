from fastapi import APIRouter
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.db.mongodb import (
    get_all_assignments,
    get_courses_with_progress,
    list_courses,
    list_assignments,
    get_course,
)

router = APIRouter(tags=["academic-progress"])


@router.get("/overview")
def get_overview():
    """Get progress overview across all courses."""
    courses = get_courses_with_progress()
    all_assignments = get_all_assignments()
    
    total_assignments = len(all_assignments)
    completed = sum(1 for a in all_assignments if a.get("status") == "submitted")
    in_progress = sum(1 for a in all_assignments if a.get("status") == "in_progress")
    
    # Due soon (within 7 days)
    now = datetime.utcnow()
    due_soon = []
    for a in all_assignments:
        if a.get("status") == "submitted":
            continue
        due_at = a.get("due_at")
        if isinstance(due_at, str):
            try:
                due_at = datetime.fromisoformat(due_at.replace("Z", "+00:00").replace("+00:00", ""))
            except:
                continue
        if due_at and due_at > now and due_at < now + timedelta(days=7):
            due_soon.append({
                "id": a["id"],
                "title": a["title"],
                "course_code": a.get("course_code"),
                "due_at": due_at.isoformat(),
                "days_until": (due_at - now).days
            })
    
    due_soon.sort(key=lambda x: x["days_until"])
    
    return {
        "total_courses": len(courses),
        "total_assignments": total_assignments,
        "completed_assignments": completed,
        "in_progress_assignments": in_progress,
        "completion_percentage": (completed / total_assignments * 100) if total_assignments > 0 else 0,
        "due_soon": due_soon[:5],
        "courses": courses
    }


@router.get("/courses/{course_id}")
def get_course_progress(course_id: str):
    """Get detailed progress for a specific course."""
    # Try to find by ID or code
    course = get_course(course_id)
    if not course:
        # Try as code
        courses = list_courses()
        course = next((c for c in courses if c.get("id") == course_id), None)
    
    if not course:
        return {"error": "Course not found"}
    
    code = course.get("code", course_id)
    assignments = list_assignments(code)
    
    total = len(assignments)
    completed = sum(1 for a in assignments if a.get("status") == "submitted")
    in_progress = sum(1 for a in assignments if a.get("status") == "in_progress")
    
    # Group by status
    breakdown = {
        "not_started": [],
        "in_progress": [],
        "submitted": []
    }
    
    for a in assignments:
        status = a.get("status", "not_started")
        if status in breakdown:
            breakdown[status].append({
                "id": a["id"],
                "title": a["title"],
                "due_at": a.get("due_at"),
                "weight": a.get("weight", 0)
            })
    
    return {
        "course": course,
        "total_assignments": total,
        "completed": completed,
        "in_progress": in_progress,
        "completion_percentage": (completed / total * 100) if total > 0 else 0,
        "breakdown": breakdown
    }


@router.get("/timeline")
def get_timeline():
    """Get timeline view of assignments."""
    all_assignments = get_all_assignments()
    
    # Group by week
    now = datetime.utcnow()
    weeks: Dict[str, List[Dict[str, Any]]] = {}
    
    for a in all_assignments:
        due_at = a.get("due_at")
        if isinstance(due_at, str):
            try:
                due_at = datetime.fromisoformat(due_at.replace("Z", "+00:00").replace("+00:00", ""))
            except:
                continue
        
        if not due_at:
            continue
        
        # Get week start (Monday)
        week_start = due_at - timedelta(days=due_at.weekday())
        week_key = week_start.strftime("%Y-%m-%d")
        
        if week_key not in weeks:
            weeks[week_key] = []
        
        weeks[week_key].append({
            "id": a["id"],
            "title": a["title"],
            "course_code": a.get("course_code"),
            "due_at": due_at.isoformat(),
            "status": a.get("status", "not_started"),
            "weight": a.get("weight", 0)
        })
    
    # Convert to sorted list
    timeline = []
    for week_start, items in sorted(weeks.items()):
        timeline.append({
            "week_start": week_start,
            "items": sorted(items, key=lambda x: x["due_at"])
        })
    
    return {"timeline": timeline}


@router.get("/traffic")
def get_traffic():
    """Get traffic light status for assignments."""
    all_assignments = get_all_assignments()
    now = datetime.utcnow()
    
    traffic = []
    for a in all_assignments:
        if a.get("status") == "submitted":
            status = "green"
        else:
            due_at = a.get("due_at")
            if isinstance(due_at, str):
                try:
                    due_at = datetime.fromisoformat(due_at.replace("Z", "+00:00").replace("+00:00", ""))
                except:
                    due_at = None
            
            if not due_at:
                status = "gray"
            elif due_at < now:
                status = "red"  # Overdue
            elif due_at < now + timedelta(days=3):
                status = "red"  # Due very soon
            elif due_at < now + timedelta(days=7):
                status = "yellow"  # Due soon
            else:
                status = "green"  # Plenty of time
        
        traffic.append({
            "id": a["id"],
            "title": a["title"],
            "course_code": a.get("course_code"),
            "status": status,
            "due_at": a.get("due_at"),
            "assignment_status": a.get("status", "not_started")
        })
    
    return {"traffic": traffic}


@router.get("/reroute")
def get_reroute():
    """Get reroute suggestions for overdue or at-risk assignments."""
    all_assignments = get_all_assignments()
    now = datetime.utcnow()
    
    suggestions = []
    for a in all_assignments:
        if a.get("status") == "submitted":
            continue
        
        due_at = a.get("due_at")
        if isinstance(due_at, str):
            try:
                due_at = datetime.fromisoformat(due_at.replace("Z", "+00:00").replace("+00:00", ""))
            except:
                continue
        
        if not due_at:
            continue
        
        days_until = (due_at - now).days
        
        if days_until < 0:
            # Overdue
            suggestions.append({
                "id": a["id"],
                "title": a["title"],
                "course_code": a.get("course_code"),
                "severity": "critical",
                "message": f"Assignment is {-days_until} days overdue. Contact instructor or submit ASAP.",
                "action": "submit_now"
            })
        elif days_until < 2 and a.get("status") == "not_started":
            # Due very soon, not started
            suggestions.append({
                "id": a["id"],
                "title": a["title"],
                "course_code": a.get("course_code"),
                "severity": "high",
                "message": f"Due in {days_until} days but not started. Prioritize this assignment.",
                "action": "start_now"
            })
        elif days_until < 5 and a.get("status") == "not_started":
            # Due soon, not started
            suggestions.append({
                "id": a["id"],
                "title": a["title"],
                "course_code": a.get("course_code"),
                "severity": "medium",
                "message": f"Due in {days_until} days. Consider starting soon.",
                "action": "plan"
            })
    
    suggestions.sort(key=lambda x: {"critical": 0, "high": 1, "medium": 2}.get(x["severity"], 3))
    
    return {"suggestions": suggestions}
