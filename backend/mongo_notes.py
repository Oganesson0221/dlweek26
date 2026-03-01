# MongoDB connection for Clippy Notes
import os
from pymongo import MongoClient
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get MongoDB URI from environment
MONGODB_URI = os.getenv("VITE_MONGODB_URI", "")

# Initialize MongoDB client
_client: Optional[MongoClient] = None
_db = None

def get_mongo_client():
    global _client, _db
    if _client is None:
        if not MONGODB_URI:
            raise ValueError("VITE_MONGODB_URI not set in environment")
        _client = MongoClient(MONGODB_URI)
        # Use explicit database name from the URI or default to 'rishikaext'
        _db = _client["rishikaext"]
    return _db

def get_notes_collection():
    db = get_mongo_client()
    return db["clippy_notes"]

# Note operations
def create_note(note_data: dict) -> dict:
    """Create a new note"""
    collection = get_notes_collection()
    
    note = {
        "content": note_data.get("content", ""),
        "subject": note_data.get("subject", "Other"),
        "tags": note_data.get("tags", []),
        "timestamp": note_data.get("timestamp", datetime.utcnow().isoformat()),
        "source": note_data.get("source", {}),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    result = collection.insert_one(note)
    note["_id"] = str(result.inserted_id)
    note["id"] = str(result.inserted_id)
    return note

def get_all_notes(subject: Optional[str] = None, search: Optional[str] = None) -> list:
    """Get all notes, optionally filtered"""
    collection = get_notes_collection()
    
    query = {}
    if subject and subject != "all":
        query["subject"] = subject
    if search:
        query["$or"] = [
            {"content": {"$regex": search, "$options": "i"}},
            {"tags": {"$elemMatch": {"$regex": search, "$options": "i"}}}
        ]
    
    notes = list(collection.find(query).sort("created_at", -1))
    
    # Convert ObjectId to string
    for note in notes:
        note["id"] = str(note["_id"])
        del note["_id"]
        # Convert datetime objects to ISO strings
        if "created_at" in note and hasattr(note["created_at"], "isoformat"):
            note["created_at"] = note["created_at"].isoformat()
        if "updated_at" in note and hasattr(note["updated_at"], "isoformat"):
            note["updated_at"] = note["updated_at"].isoformat()
    
    return notes

def get_note_by_id(note_id: str) -> Optional[dict]:
    """Get a single note by ID"""
    from bson import ObjectId
    collection = get_notes_collection()
    
    try:
        note = collection.find_one({"_id": ObjectId(note_id)})
        if note:
            note["id"] = str(note["_id"])
            del note["_id"]
        return note
    except:
        return None

def update_note(note_id: str, updates: dict) -> Optional[dict]:
    """Update a note"""
    from bson import ObjectId
    collection = get_notes_collection()
    
    try:
        updates["updated_at"] = datetime.utcnow()
        result = collection.find_one_and_update(
            {"_id": ObjectId(note_id)},
            {"$set": updates},
            return_document=True
        )
        if result:
            result["id"] = str(result["_id"])
            del result["_id"]
        return result
    except:
        return None

def delete_note(note_id: str) -> bool:
    """Delete a note"""
    from bson import ObjectId
    collection = get_notes_collection()
    
    try:
        result = collection.delete_one({"_id": ObjectId(note_id)})
        return result.deleted_count > 0
    except:
        return False

def delete_all_notes() -> int:
    """Delete all notes (use with caution)"""
    collection = get_notes_collection()
    result = collection.delete_many({})
    return result.deleted_count
