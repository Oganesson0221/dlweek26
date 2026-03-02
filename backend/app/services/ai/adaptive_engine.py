import json
import os
import uuid
from fastapi import HTTPException
from app.core.config import get_settings
from app.services.ai.openai_key import get_ai_client
from app.services.ai.prompt_banks import IMPROVEMENT_SYSTEM_PROMPT
from app.services.ai.quiz_services import _parse_gpt_response, _build_question_objects
from app.schemas import QuizResponse

# Client is lazy-loaded via get_ai_client()

async def generate_improvement_quiz(wrong_file_path: str = "wrong_questions.json") -> QuizResponse:
    settings = get_settings()
    client = get_ai_client()
    
    if not os.path.exists(wrong_file_path):
        raise HTTPException(404, "No wrong questions found.")
    
    with open(wrong_file_path, "r", encoding="utf-8") as f:
        wrong_questions = json.load(f)

    prompt = f"Generate new questions based on these missed ones:\n{json.dumps(wrong_questions)}\nReturn EXACT JSON array of 'questions'."
    
    response = await client.chat.completions.create(
        model=settings.primary_model,
        messages=[
            {"role": "system", "content": IMPROVEMENT_SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        temperature=0.4,
        response_format={"type": "json_object"},
    )
    
    parsed = _parse_gpt_response(response.choices[0].message.content)
    questions = _build_question_objects(parsed.get("questions", []))
    
    return QuizResponse(
        id=str(uuid.uuid4()),
        title="Improvement Quiz",
        total_questions=len(questions),
        total_marks=sum(q.marks for q in questions),
        questions=questions,
    )