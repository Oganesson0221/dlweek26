from fastapi import APIRouter
from app.schemas import QuizResponse
import os
from app.core.config import get_settings
import json
import uuid
from datetime import datetime
from app.services.ai.openai_key import get_ai_client
from fastapi import HTTPException, Query
from app.services.ai.quiz_services import _parse_gpt_response, _build_question_objects
from app.db.mongodb import get_wrong_questions, get_weak_topics, clear_wrong_questions, get_quiz_results, get_all_quiz_results

# Client is lazy-loaded via get_ai_client()

router = APIRouter(tags=["AI Adaptive Learning"])

@router.post("/generate-test", response_model=QuizResponse)
async def create_improvement_test(course_code: str = Query(None)):
    """Generates a test based on previously missed questions from MongoDB, optionally filtered by course"""
    return await generate_improvement_quiz(course_code=course_code)

@router.get("/weak-topics")
async def get_user_weak_topics(user_id: str = Query("default"), course_code: str = Query(None)):
    """Get weak topics based on wrong questions from MongoDB, optionally filtered by course"""
    weak_topics = get_weak_topics(user_id=user_id, course_code=course_code)
    total_wrong = sum(t.get("count", 0) for t in weak_topics)
    
    # Format for frontend - add percentage
    formatted_topics = []
    for topic in weak_topics:
        count = topic.get("count", 0)
        formatted_topics.append({
            "topic": topic.get("topic", "General"),
            "count": count,
            "percentage": (count / total_wrong * 100) if total_wrong > 0 else 0
        })
    
    return {
        "weak_topics": formatted_topics,
        "total_wrong": total_wrong
    }

@router.get("/wrong-questions")
async def get_all_wrong_questions(user_id: str = Query("default"), course_code: str = Query(None)):
    """Get all wrong questions from MongoDB, optionally filtered by course"""
    questions = get_wrong_questions(user_id=user_id, course_code=course_code)
    return {
        "user_id": user_id,
        "wrong_questions": questions
    }

@router.delete("/wrong-questions")
async def clear_all_wrong_questions(user_id: str = Query("default"), course_code: str = Query(None)):
    """Clear all wrong questions after mastery, optionally filtered by course"""
    clear_wrong_questions(user_id=user_id, course_code=course_code)
    return {"message": "Wrong questions cleared successfully"}

@router.get("/quiz-results")
async def get_user_quiz_results(user_id: str = Query("default"), limit: int = Query(10)):
    """Get recent quiz results for a user from MongoDB"""
    results = get_quiz_results(user_id=user_id, limit=limit)
    return {
        "user_id": user_id,
        "results": results
    }

@router.get("/quiz-results/all")
async def get_all_user_quiz_results(limit: int = Query(20)):
    """Get all recent quiz results from MongoDB"""
    results = get_all_quiz_results(limit=limit)
    return {
        "results": results
    }

SYSTEM_PROMPT = """You are an expert educational assessment designer.
Your task is to create a remedial improvement quiz based on questions a student previously got wrong.

Rules:
1. Identify the core concept tested in each missed question.
2. Generate exactly one NEW multiple-choice question for each missed question.
3. The new question must test the EXACT same concept, but use a different scenario, phrasing, or example.
4. Provide exactly 4 options (A–D) with only 1 correct option.
5. Provide a detailed explanation of why the correct answer is right, aiming to fix the student's knowledge gap.
6. Return ONLY valid JSON. No markdown, no prose, no extra text.
"""

# ─── Main Generation ──────────────────────────────────────────────────────────

async def generate_improvement_quiz(course_code: str = None) -> QuizResponse:
    """
    Reads the user's previously missed questions from MongoDB and generates a targeted improvement quiz.
    Optionally filters by course_code to focus on a specific subject.
    """
    settings = get_settings()
    client = get_ai_client()

    # 1. Load the missed questions from MongoDB
    wrong_questions = get_wrong_questions(user_id="default", course_code=course_code)

    if not wrong_questions:
        raise HTTPException(status_code=400, detail="No wrong questions available. Take a quiz first!")

    # 2. Build the prompt
    prompt = f"""Generate a new improvement quiz based on these previously missed questions.

Missed Questions:
{json.dumps(wrong_questions, indent=2)}

Return this EXACT JSON structure:
{{
  "questions": [
    {{
      "id": "impr_q1",
      "type": "mcq",
      "question": "New question text testing the same concept?",
      "topic": "Topic from the original question",
      "difficulty": "medium",
      "marks": 1,
      "options": [
        {{"label": "A", "text": "Option text", "is_correct": false}},
        {{"label": "B", "text": "Option text", "is_correct": true}},
        {{"label": "C", "text": "Option text", "is_correct": false}},
        {{"label": "D", "text": "Option text", "is_correct": false}}
      ],
      "explanation": "B is correct because..."
    }}
  ]
}}"""

    # 3. Call the LLM
    try:
        response = await client.chat.completions.create(
            model=settings.primary_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
            max_tokens=4000,
            response_format={"type": "json_object"},
        )
        raw_json = response.choices[0].message.content
    except Exception as e:
        raise HTTPException(502, f"OpenAI API error during improvement generation: {e}")

    # 4. Parse and format the output
    parsed = _parse_gpt_response(raw_json)
    questions = _build_question_objects(parsed.get("questions", []))

    total_marks = sum(q.marks for q in questions)
    total_qs = len(questions)

    quiz_id = str(uuid.uuid4())
    return QuizResponse(
        id=quiz_id,
        title="Improvement Quiz",
        source_file="mongodb_wrong_questions",
        topic="Remedial Review",
        total_questions=total_qs,
        total_marks=total_marks,
        estimated_duration_minutes=total_qs * 2,
        questions=questions,
        topics_covered=list({q.topic for q in questions if q.topic}),
        metadata={
            "difficulty": "mixed",
            "model_used": settings.primary_model,
            "mcq_count": total_qs,
        },
        created_at=datetime.utcnow().isoformat(),
    )