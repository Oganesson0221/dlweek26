"""
Notes Router - MongoDB-backed notes CRUD operations
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId
import certifi

# Load .env from project root
def find_env_file():
    current = Path(__file__).resolve().parent
    for _ in range(5):
        env_path = current / ".env"
        if env_path.exists():
            return str(env_path)
        current = current.parent
    return None

env_file = find_env_file()
if env_file:
    load_dotenv(env_file)

router = APIRouter(tags=["Notes"])

# MongoDB connection
MONGODB_URI = os.getenv("VITE_MONGODB_URI", "")
_client: Optional[MongoClient] = None
_db = None


def get_mongo_client():
    global _client, _db
    if _client is None:
        if not MONGODB_URI:
            raise ValueError("VITE_MONGODB_URI not set in environment")
        _client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000, tlsCAFile=certifi.where())
        _db = _client["rishikaext"]
    return _db


def get_notes_collection():
    db = get_mongo_client()
    return db["clippy_notes"]


# Pydantic models
class NoteCreate(BaseModel):
    content: str
    subject: str = "Other"
    sourceUrl: Optional[str] = None
    tags: Optional[List[str]] = None


class NoteUpdate(BaseModel):
    content: Optional[str] = None
    subject: Optional[str] = None
    tags: Optional[List[str]] = None


class NoteResponse(BaseModel):
    id: str
    content: str
    subject: str
    sourceUrl: Optional[str] = None
    tags: List[str] = []
    created_at: str
    updated_at: Optional[str] = None


class NotesListResponse(BaseModel):
    notes: List[NoteResponse]
    total: int


# Routes
@router.get("", response_model=NotesListResponse)
async def list_notes(
    subject: Optional[str] = Query(None, description="Filter by subject"),
    search: Optional[str] = Query(None, description="Search in content and tags")
):
    """Get all notes, optionally filtered by subject or search term"""
    try:
        collection = get_notes_collection()
        
        query = {}
        if subject and subject != "all":
            query["subject"] = subject
        if search:
            query["$or"] = [
                {"content": {"$regex": search, "$options": "i"}},
                {"tags": {"$elemMatch": {"$regex": search, "$options": "i"}}}
            ]
        
        notes_cursor = collection.find(query).sort("created_at", -1)
        notes = []
        
        for note in notes_cursor:
            note_dict = {
                "id": str(note["_id"]),
                "content": note.get("content", ""),
                "subject": note.get("subject", "Other"),
                "sourceUrl": note.get("sourceUrl") or note.get("source", {}).get("url"),
                "tags": note.get("tags", []),
                "created_at": note["created_at"].isoformat() if hasattr(note.get("created_at"), "isoformat") else str(note.get("created_at", "")),
                "updated_at": note["updated_at"].isoformat() if hasattr(note.get("updated_at"), "isoformat") else str(note.get("updated_at", "")) if note.get("updated_at") else None
            }
            notes.append(note_dict)
        
        return NotesListResponse(notes=notes, total=len(notes))
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch notes: {e}")


@router.post("", response_model=NoteResponse)
async def create_note(note_data: NoteCreate):
    """Create a new note"""
    try:
        collection = get_notes_collection()
        
        now = datetime.utcnow()
        note = {
            "content": note_data.content,
            "subject": note_data.subject,
            "tags": note_data.tags or [],
            "sourceUrl": note_data.sourceUrl,
            "source": {"url": note_data.sourceUrl} if note_data.sourceUrl else {},
            "created_at": now,
            "updated_at": now,
        }
        
        result = collection.insert_one(note)
        
        return NoteResponse(
            id=str(result.inserted_id),
            content=note["content"],
            subject=note["subject"],
            sourceUrl=note["sourceUrl"],
            tags=note["tags"],
            created_at=now.isoformat(),
            updated_at=now.isoformat()
        )
    except Exception as e:
        raise HTTPException(500, f"Failed to create note: {e}")


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(note_id: str):
    """Get a single note by ID"""
    try:
        collection = get_notes_collection()
        note = collection.find_one({"_id": ObjectId(note_id)})
        
        if not note:
            raise HTTPException(404, "Note not found")
        
        return NoteResponse(
            id=str(note["_id"]),
            content=note.get("content", ""),
            subject=note.get("subject", "Other"),
            sourceUrl=note.get("sourceUrl") or note.get("source", {}).get("url"),
            tags=note.get("tags", []),
            created_at=note["created_at"].isoformat() if hasattr(note.get("created_at"), "isoformat") else str(note.get("created_at", "")),
            updated_at=note["updated_at"].isoformat() if hasattr(note.get("updated_at"), "isoformat") else None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to get note: {e}")


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(note_id: str, updates: NoteUpdate):
    """Update a note"""
    try:
        collection = get_notes_collection()
        
        update_dict = {"updated_at": datetime.utcnow()}
        if updates.content is not None:
            update_dict["content"] = updates.content
        if updates.subject is not None:
            update_dict["subject"] = updates.subject
        if updates.tags is not None:
            update_dict["tags"] = updates.tags
        
        result = collection.find_one_and_update(
            {"_id": ObjectId(note_id)},
            {"$set": update_dict},
            return_document=True
        )
        
        if not result:
            raise HTTPException(404, "Note not found")
        
        return NoteResponse(
            id=str(result["_id"]),
            content=result.get("content", ""),
            subject=result.get("subject", "Other"),
            sourceUrl=result.get("sourceUrl") or result.get("source", {}).get("url"),
            tags=result.get("tags", []),
            created_at=result["created_at"].isoformat() if hasattr(result.get("created_at"), "isoformat") else str(result.get("created_at", "")),
            updated_at=result["updated_at"].isoformat() if hasattr(result.get("updated_at"), "isoformat") else None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to update note: {e}")


@router.delete("/{note_id}")
async def delete_note(note_id: str):
    """Delete a note"""
    try:
        collection = get_notes_collection()
        result = collection.delete_one({"_id": ObjectId(note_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(404, "Note not found")
        
        return {"success": True, "message": "Note deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to delete note: {e}")
