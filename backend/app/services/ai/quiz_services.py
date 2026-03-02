import json
import uuid
import re
import os
from typing import List
from datetime import datetime, timezone
from fastapi import HTTPException

from app.core.config import get_settings
from app.services.ai.openai_key import get_ai_client
from app.services.ai.prompt_banks import QUIZ_SYSTEM_PROMPT, GRADING_PROMPT_TEMPLATE
from app.schemas import QuizQuestion, MCQOption, QuizResponse, QuestionType, DifficultyLevel, QuizGenerateRequest, StudentAnswer
from app.services.file_parser import SlideContent, build_content_string
from app.db.mongodb import save_wrong_questions, save_quiz_result

# Client is now lazy-loaded via get_ai_client()

def _parse_gpt_response(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise HTTPException(500, f"Failed to parse GPT JSON: {e}")


def _normalize_options(raw_options, correct_answer: str = "") -> List[MCQOption]:
    if not raw_options:
        return []

    normalized: List[MCQOption] = []
    label_pool = ["A", "B", "C", "D", "E", "F"]
    correct_label = correct_answer.strip().upper() if correct_answer else ""

    for idx, raw_opt in enumerate(raw_options):
        if isinstance(raw_opt, dict):
            label = str(raw_opt.get("label", label_pool[idx] if idx < len(label_pool) else chr(65 + idx)))
            text = str(raw_opt.get("text", raw_opt.get("option", ""))).strip()
            # Check is_correct from dict, OR match against correct_answer label
            is_correct = bool(raw_opt.get("is_correct", raw_opt.get("correct", False)))
            if not is_correct and correct_label and label.upper() == correct_label:
                is_correct = True
            normalized.append(MCQOption(label=label, text=text, is_correct=is_correct))
            continue

        if isinstance(raw_opt, str):
            value = raw_opt.strip()
            match = re.match(r"^([A-F])[\).:\-\s]+(.+)$", value, re.IGNORECASE)
            if match:
                label = match.group(1).upper()
                text = match.group(2).strip()
            else:
                label = label_pool[idx] if idx < len(label_pool) else chr(65 + idx)
                text = value
            is_correct = correct_label and label.upper() == correct_label
            normalized.append(MCQOption(label=label, text=text, is_correct=is_correct))

    return normalized

def _build_question_objects(raw_questions: list) -> List[QuizQuestion]:
    questions = []
    for i, q in enumerate(raw_questions):
        q_id = q.get("id") or f"q{i + 1}"
        correct_answer = q.get("correct_answer", "")
        options = _normalize_options(q.get("options", []), correct_answer)
        questions.append(QuizQuestion(
            id=q_id,
            type=QuestionType.mcq,
            question=q.get("question", ""),
            topic=q.get("topic", ""),
            difficulty=DifficultyLevel(q.get("difficulty", "medium")),
            marks=int(q.get("marks", 1)),
            options=options,
            explanation=q.get("explanation", ""),
            slide_reference=q.get("slide_reference"),
        ))
    return questions


def _parse_answer_tokens(answer: str) -> List[str]:
    if not answer:
        return []
    parts = re.split(r"[,;/|]", answer)
    return [p.strip().upper() for p in parts if p and p.strip()]


def _compute_scores(quiz_questions: List[QuizQuestion], student_answers: List[StudentAnswer]) -> tuple[float, int, float, int, int, set[str]]:
    answer_map = {a.question_id: a.answer for a in student_answers}
    marks_available = sum(q.marks for q in quiz_questions)
    marks_earned = 0.0
    wrong_ids: set[str] = set()

    for question in quiz_questions:
        student_raw = answer_map.get(question.id, "")
        student_tokens = _parse_answer_tokens(student_raw)

        correct_labels = {
            option.label.strip().upper()
            for option in (question.options or [])
            if option.is_correct and option.label
        }

        is_correct = False
        if correct_labels and student_tokens:
            if question.type == QuestionType.multi_select:
                is_correct = set(student_tokens) == correct_labels
            else:
                is_correct = student_tokens[0] in correct_labels

        if is_correct:
            marks_earned += question.marks
        else:
            wrong_ids.add(question.id)

    score_pct = round((marks_earned / marks_available) * 100, 2) if marks_available else 0.0
    total_wrong = len(wrong_ids)
    total_correct = max(len(quiz_questions) - total_wrong, 0)
    return marks_earned, marks_available, score_pct, total_correct, total_wrong, wrong_ids

async def generate_quiz_from_slides(slides: List[SlideContent], request: QuizGenerateRequest, filename: str) -> QuizResponse:
    settings = get_settings()
    client = get_ai_client()
    content_string = build_content_string(slides)
    topics = [s.heading for s in slides if s.heading]
    
    user_prompt = f"Slide Content:\n{content_string}\n\nGenerate {request.num_mcq} MCQs."
    
    response = await client.chat.completions.create(
        model=settings.primary_model,
        messages=[
            {"role": "system", "content": QUIZ_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.4,
        response_format={"type": "json_object"},
    )
    
    parsed = _parse_gpt_response(response.choices[0].message.content)
    questions = _build_question_objects(parsed.get("questions", []))
    total_qs = len(questions)
    
    return QuizResponse(
        id=str(uuid.uuid4()),
        title=request.title,
        source_file=filename,
        topic=request.topic or "",
        total_questions=total_qs,
        total_marks=sum(q.marks for q in questions),
        estimated_duration_minutes=total_qs * 2,
        questions=questions,
        topics_covered=topics,
        metadata={"model": settings.primary_model},
        created_at=datetime.now(timezone.utc).isoformat(),
    )

async def grade_and_record_quiz(
    quiz_questions: List[QuizQuestion], 
    student_answers: List[StudentAnswer], 
    wrong_file_path: str = "wrong_questions.json",
    quiz_id: str = None,
    course_code: str = None,
    time_spent_minutes: int = 0,
    user_id: str = "default"
) -> dict:
    settings = get_settings()
    client = get_ai_client()
    
    q_data = [{"id": q.id, "options": [o.model_dump() for o in (q.options or [])], "marks_available": q.marks} for q in quiz_questions]
    a_data = [{"question_id": a.question_id, "student_answer": a.answer} for a in student_answers]
    
    prompt = GRADING_PROMPT_TEMPLATE.format(questions_json=json.dumps(q_data), answers_json=json.dumps(a_data))
    
    response = await client.chat.completions.create(
        model=settings.primary_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        response_format={"type": "json_object"},
    )
    
    graded_data = _parse_gpt_response(response.choices[0].message.content)
    marks_earned, marks_available, score_pct, total_correct, total_wrong, wrong_ids = _compute_scores(quiz_questions, student_answers)
    graded_data["marks_earned"] = marks_earned
    graded_data["marks_available"] = marks_available
    graded_data["score_pct"] = score_pct
    graded_data["total_correct"] = total_correct
    graded_data["total_wrong"] = total_wrong
    
    # Save wrong questions for adaptive engine (MongoDB)
    if wrong_ids:
        wrong_questions = [q.model_dump() for q in quiz_questions if q.id in wrong_ids]
        save_wrong_questions(wrong_questions, user_id=user_id, course_code=course_code)
    
    # Save quiz result to MongoDB
    topics_covered = list(set(q.topic for q in quiz_questions if q.topic))
    save_quiz_result(
        user_id=user_id,
        quiz_id=quiz_id or str(uuid.uuid4()),
        score=score_pct,
        total_questions=len(quiz_questions),
        correct_answers=total_correct,
        wrong_answers=total_wrong,
        time_spent_minutes=time_spent_minutes,
        course_code=course_code,
        topics_covered=topics_covered
    )
            
    return graded_data