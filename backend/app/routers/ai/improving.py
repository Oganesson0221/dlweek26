from fastapi import APIRouter
from app.schemas import QuizResponse
import os
from app.services.ai.adaptive_engine import generate_improvement_quiz
from app.core.config import get_settings
import json
import uuid
from datetime import datetime
from app.services.ai.openai_key import get_ai_client
from fastapi import HTTPException
from app.services.ai.quiz_services import _parse_gpt_response, _build_question_objects
client = get_ai_client()

router = APIRouter(prefix="/ai/improve", tags=["AI Adaptive Learning"])

@router.post("/generate-test", response_model=QuizResponse)
async def create_improvement_test():
    """Generates a test based on previously missed questions in wrong_questions.json"""
    return await generate_improvement_quiz()

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

async def generate_improvement_quiz(wrong_file_path: str = "wrong_questions.json") -> QuizResponse:
    """
    Reads the user's previously missed questions and generates a targeted improvement quiz.
    """
    settings = get_settings()

    # 1. Load the missed questions
    if not os.path.exists(wrong_file_path):
        raise HTTPException(status_code=404, detail="No wrong questions file found. Take a quiz first!")

    try:
        with open(wrong_file_path, "r", encoding="utf-8") as f:
            wrong_questions = json.load(f)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to read the wrong questions file.")

    if not wrong_questions:
        raise HTTPException(status_code=400, detail="No wrong questions available to improve upon.")

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

    # Note: We optionally clear the wrong_questions.json here if you want to 'reset' 
    # the improvement queue after generating the test.
    # os.remove(wrong_file_path)

    quiz_id = str(uuid.uuid4())
    return QuizResponse(
        id=quiz_id,
        title="Improvement Quiz",
        source_file="wrong_questions.json",
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