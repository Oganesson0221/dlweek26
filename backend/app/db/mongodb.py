# MongoDB connection and operations for Study Navigator
import os
import ssl
import certifi
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv("VITE_MONGODB_URI", "")
DB_NAME = "rishikaext"

_client: Optional[MongoClient] = None

def get_db():
    global _client
    if _client is None:
        if not MONGODB_URI:
            raise ValueError("VITE_MONGODB_URI not set")
        # Use certifi for SSL certificate verification on macOS
        _client = MongoClient(MONGODB_URI, tlsCAFile=certifi.where())
    return _client[DB_NAME]

# Helper to convert ObjectId to string
def serialize_doc(doc: dict) -> dict:
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    # Convert datetime objects
    for key in ["created_at", "updated_at", "due_at", "remind_at", "suggested_start_at", "last_updated_at"]:
        if key in doc and hasattr(doc[key], "isoformat"):
            doc[key] = doc[key].isoformat()
    return doc

def serialize_docs(docs: list) -> list:
    return [serialize_doc(d) for d in docs]

# ============ COURSES ============

def create_course(code: str, name: str, term: str = "Y2S2") -> dict:
    db = get_db()
    # Check if exists
    existing = db.courses.find_one({"code": code})
    if existing:
        return serialize_doc(existing)
    
    course = {
        "code": code,
        "name": name,
        "term": term,
        "created_at": datetime.utcnow()
    }
    result = db.courses.insert_one(course)
    course["_id"] = result.inserted_id
    
    # Create empty outline
    db.outlines.insert_one({
        "course_code": code,
        "description": "",
        "instructor": "",
        "last_updated_at": datetime.utcnow()
    })
    
    return serialize_doc(course)

def list_courses() -> list:
    db = get_db()
    return serialize_docs(db.courses.find())

def get_course(code: str) -> Optional[dict]:
    db = get_db()
    course = db.courses.find_one({"code": code})
    return serialize_doc(course) if course else None

# ============ OUTLINES ============

def get_outline(course_code: str) -> Optional[dict]:
    db = get_db()
    outline = db.outlines.find_one({"course_code": course_code})
    return serialize_doc(outline) if outline else None

def upsert_outline(course_code: str, description: str, instructor: str) -> dict:
    db = get_db()
    outline = db.outlines.find_one({"course_code": course_code})
    
    if outline:
        db.outlines.update_one(
            {"course_code": course_code},
            {"$set": {
                "description": description,
                "instructor": instructor,
                "last_updated_at": datetime.utcnow()
            }}
        )
        outline = db.outlines.find_one({"course_code": course_code})
    else:
        outline = {
            "course_code": course_code,
            "description": description,
            "instructor": instructor,
            "last_updated_at": datetime.utcnow()
        }
        db.outlines.insert_one(outline)
        
    return serialize_doc(outline)

# ============ COMPONENTS ============

def get_components(course_code: str) -> list:
    db = get_db()
    return serialize_docs(db.components.find({"course_code": course_code}))

def replace_components(course_code: str, components: List[tuple]) -> list:
    db = get_db()
    # Delete existing
    db.components.delete_many({"course_code": course_code})
    
    # Insert new
    result = []
    for name, weight in components:
        comp = {
            "course_code": course_code,
            "name": name,
            "weight": weight,
            "created_at": datetime.utcnow()
        }
        db.components.insert_one(comp)
        result.append(serialize_doc(comp))
    
    return result

# ============ TOPICS ============

def get_topics(course_code: str) -> list:
    db = get_db()
    topics = list(db.topics.find({"course_code": course_code}))
    topics.sort(key=lambda t: (t.get("parent_id") or "", t.get("order_index", 0)))
    return serialize_docs(topics)

def add_topic(course_code: str, parent_id: Optional[str], title: str, order_index: int) -> dict:
    db = get_db()
    topic = {
        "course_code": course_code,
        "parent_id": parent_id,
        "title": title,
        "order_index": order_index,
        "created_at": datetime.utcnow()
    }
    result = db.topics.insert_one(topic)
    topic["_id"] = result.inserted_id
    return serialize_doc(topic)

# ============ ASSIGNMENTS ============

def create_assignment(course_code: str, title: str, description: str, due_at: datetime, weight: float) -> dict:
    db = get_db()
    assignment = {
        "course_code": course_code,
        "title": title,
        "description": description,
        "due_at": due_at,
        "weight": weight,
        "status": "not_started",
        "created_at": datetime.utcnow()
    }
    result = db.assignments.insert_one(assignment)
    assignment["_id"] = result.inserted_id
    return serialize_doc(assignment)

def list_assignments(course_code: str) -> list:
    db = get_db()
    return serialize_docs(db.assignments.find({"course_code": course_code}))

def get_assignment(assignment_id: str) -> Optional[dict]:
    db = get_db()
    try:
        assignment = db.assignments.find_one({"_id": ObjectId(assignment_id)})
        return serialize_doc(assignment) if assignment else None
    except:
        return None

def update_assignment_status(assignment_id: str, status: str) -> Optional[dict]:
    db = get_db()
    try:
        db.assignments.update_one(
            {"_id": ObjectId(assignment_id)},
            {"$set": {"status": status}}
        )
        return get_assignment(assignment_id)
    except:
        return None

# ============ REMINDERS ============

def get_reminders(assignment_id: str) -> list:
    db = get_db()
    return serialize_docs(db.reminders.find({"assignment_id": assignment_id}))

def create_reminder(assignment_id: str, remind_at: datetime, message: str, channel: str = "in_app") -> dict:
    db = get_db()
    reminder = {
        "assignment_id": assignment_id,
        "remind_at": remind_at,
        "message": message,
        "channel": channel,
        "status": "scheduled",
        "created_at": datetime.utcnow()
    }
    result = db.reminders.insert_one(reminder)
    reminder["_id"] = result.inserted_id
    return serialize_doc(reminder)

def get_due_reminders() -> list:
    db = get_db()
    now = datetime.utcnow()
    return serialize_docs(db.reminders.find({
        "remind_at": {"$lte": now},
        "status": "scheduled"
    }))

def mark_reminder_sent(reminder_id: str) -> bool:
    db = get_db()
    try:
        db.reminders.update_one(
            {"_id": ObjectId(reminder_id)},
            {"$set": {"status": "sent"}}
        )
        return True
    except:
        return False

# ============ WORKPLANS ============

def get_workplan(assignment_id: str) -> Optional[dict]:
    db = get_db()
    plan = db.workplans.find_one({"assignment_id": assignment_id})
    return serialize_doc(plan) if plan else None

def create_workplan(assignment_id: str, suggested_start_at: datetime, planned_hours: float, difficulty: str, rationale: str) -> dict:
    db = get_db()
    plan = {
        "assignment_id": assignment_id,
        "suggested_start_at": suggested_start_at,
        "planned_hours": planned_hours,
        "difficulty": difficulty,
        "rationale": rationale,
        "created_at": datetime.utcnow()
    }
    result = db.workplans.insert_one(plan)
    plan["_id"] = result.inserted_id
    return serialize_doc(plan)

# ============ GENERATED DOCUMENTS ============

def save_generated_doc(assignment_id: str, doc_type: str, file_name: str, file_path: str) -> dict:
    db = get_db()
    doc = {
        "assignment_id": assignment_id,
        "doc_type": doc_type,
        "file_name": file_name,
        "file_path": file_path,
        "created_at": datetime.utcnow()
    }
    result = db.generated_docs.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)

def get_generated_doc(doc_id: str) -> Optional[dict]:
    db = get_db()
    try:
        doc = db.generated_docs.find_one({"_id": ObjectId(doc_id)})
        return serialize_doc(doc) if doc else None
    except:
        return None

# ============ PROGRESS TRACKING ============

def get_all_assignments() -> list:
    db = get_db()
    return serialize_docs(db.assignments.find())

def get_courses_with_progress() -> list:
    """Get all courses with assignment counts"""
    db = get_db()
    courses = list(db.courses.find())
    result = []
    for course in courses:
        code = course["code"]
        assignments = list(db.assignments.find({"course_code": code}))
        total = len(assignments)
        completed = sum(1 for a in assignments if a.get("status") == "submitted")
        result.append({
            **serialize_doc(course),
            "total_assignments": total,
            "completed_assignments": completed,
            "progress": (completed / total * 100) if total > 0 else 0
        })
    return result

# ============ WRONG QUESTIONS (Quiz Weak Topics) ============

def save_wrong_questions(questions: List[Dict[str, Any]], user_id: str = "default", course_code: Optional[str] = None) -> dict:
    """Save wrong quiz questions to MongoDB for adaptive learning."""
    db = get_db()
    doc = {
        "user_id": user_id,
        "course_code": course_code,
        "questions": questions,
        "created_at": datetime.utcnow()
    }
    result = db.wrong_questions.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)

def get_wrong_questions(user_id: str = "default", course_code: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all wrong questions for a user for weak topic practice, optionally filtered by course."""
    db = get_db()
    if course_code:
        query["course_code"] = course_code
    docs = list(db.wrong_questions.find(query).sort("created_at", -1))
    all_questions = []
    for doc in docs:
        all_questions.extend(doc.get("questions", []))
    return all_questions

def clear_wrong_questions(user_id: str = "default", course_code: Optional[str] = None) -> bool:
    """Clear wrong questions after improvement."""
    db = get_db()
    query = {"user_id": user_id}
    if course_code:
        query["course_code"] = course_code
    db.wrong_questions.delete_many(query)
    return True

def get_weak_topics(user_id: str = "default", course_code: Optional[str] = None) -> List[Dict[str, Any]]:
    """Analyze wrong questions to identify weak topics."""
    questions = get_wrong_questions(user_id, course_code)
    topic_counts = {}
    for q in questions:
        topic = q.get("topic", "General")
        if topic not in topic_counts:
            topic_counts[topic] = {"topic": topic, "count": 0, "questions": []}
        topic_counts[topic]["count"] += 1
        topic_counts[topic]["questions"].append(q)
    
    # Sort by count descending
    weak_topics = sorted(topic_counts.values(), key=lambda x: x["count"], reverse=True)
    return weak_topics


# ============ QUIZ RESULTS ============

def save_quiz_result(
    user_id: str,
    quiz_id: str,
    score: float,
    total_questions: int,
    correct_answers: int,
    wrong_answers: int,
    time_spent_minutes: int,
    course_code: Optional[str] = None,
    topics_covered: Optional[List[str]] = None
) -> dict:
    """Save quiz result to MongoDB."""
    db = get_db()
    result = {
        "user_id": user_id,
        "quiz_id": quiz_id,
        "score": score,
        "total_questions": total_questions,
        "correct_answers": correct_answers,
        "wrong_answers": wrong_answers,
        "time_spent_minutes": time_spent_minutes,
        "course_code": course_code,
        "topics_covered": topics_covered or [],
        "created_at": datetime.utcnow()
    }
    db_result = db.quiz_results.insert_one(result)
    result["_id"] = db_result.inserted_id
    return serialize_doc(result)

def get_quiz_results(user_id: str = "default", limit: int = 10) -> List[Dict[str, Any]]:
    """Get recent quiz results for a user."""
    db = get_db()
    results = list(db.quiz_results.find({"user_id": user_id}).sort("created_at", -1).limit(limit))
    return serialize_docs(results)

def get_all_quiz_results(limit: int = 20) -> List[Dict[str, Any]]:
    """Get recent quiz results for all users."""
    db = get_db()
    results = list(db.quiz_results.find().sort("created_at", -1).limit(limit))
    return serialize_docs(results)


# ============ SAVED COURSE MATERIALS ============

def save_course_material(
    filename: str,
    slides: List[Dict[str, Any]],
    course_code: Optional[str] = None,
    user_id: str = "default",
    title: Optional[str] = None
) -> dict:
    """Save parsed slide content for reuse in quiz generation."""
    db = get_db()
    
    # Check if this file already exists for the user
    existing = db.course_materials.find_one({
        "user_id": user_id,
        "filename": filename
    })
    
    doc = {
        "user_id": user_id,
        "filename": filename,
        "title": title or filename,
        "course_code": course_code,
        "slides": slides,
        "total_slides": len(slides),
        "updated_at": datetime.utcnow()
    }
    
    if existing:
        # Update existing material
        db.course_materials.update_one(
            {"_id": existing["_id"]},
            {"$set": doc}
        )
        doc["_id"] = existing["_id"]
    else:
        # Insert new material
        doc["created_at"] = datetime.utcnow()
        result = db.course_materials.insert_one(doc)
        doc["_id"] = result.inserted_id
    
    return serialize_doc(doc)

def get_course_materials(user_id: str = "default", course_code: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get saved course materials for a user, optionally filtered by course."""
    db = get_db()
    query = {"user_id": user_id}
    if course_code:
        query["course_code"] = course_code
    materials = list(db.course_materials.find(query).sort("updated_at", -1))
    return serialize_docs(materials)

def get_course_material_by_id(material_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific course material by ID."""
    db = get_db()
    try:
        doc = db.course_materials.find_one({"_id": ObjectId(material_id)})
        return serialize_doc(doc) if doc else None
    except:
        return None

def delete_course_material(material_id: str, user_id: str = "default") -> bool:
    """Delete a course material."""
    db = get_db()
    try:
        result = db.course_materials.delete_one({
            "_id": ObjectId(material_id),
            "user_id": user_id
        })
        return result.deleted_count > 0
    except:
        return False
