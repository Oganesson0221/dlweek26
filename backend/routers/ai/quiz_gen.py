"""
Quiz generation service.
Handles:
  - Prompt construction with slide content (Strictly MCQ)
  - Structured JSON output (via response_format)
  - Streaming generation
  - LLM-based exam grading (Score only)
"""
import json
import uuid
import re
from typing import List, AsyncGenerator
from datetime import datetime

from dotenv import load_dotenv
from openai import AsyncOpenAI
from fastapi import HTTPException

from config import get_settings
from schemas import (
    QuizQuestion, MCQOption, QuizResponse,
    QuestionType, DifficultyLevel, QuizGenerateRequest,
    StudentAnswer,
)
from services.file_parser import SlideContent, build_content_string

# ─── Initialization ───────────────────────────────────────────────────────────

# Load environment variables (including OPENAI_API_KEY)
load_dotenv()

# AsyncOpenAI automatically picks up the OPENAI_API_KEY from the environment
client = AsyncOpenAI()


# ─── Prompt Construction ──────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert educational assessment designer with deep expertise in creating high-quality quiz questions.

Your task is to generate multiple-choice quiz questions from lecture slide content provided by the user.

Rules:
1. Every question must be directly answerable from the slide content provided.
2. Do NOT invent information not present in the slides.
3. Vary cognitive levels: mix recall, comprehension, application, and analysis.
4. For every MCQ: provide exactly 4 options (A–D) with only 1 correct option.
5. Every question must include a "topic" field (the slide title it came from).
6. Every question must include a "slide_reference" like "Slide 3".
7. Explanations should teach — explain WHY the answer is correct.
8. Return ONLY valid JSON. No markdown, no prose, no extra text.
"""


def build_user_prompt(
    slides_content: str,
    request: QuizGenerateRequest,
    slide_topics: List[str],
) -> str:
    total_questions = getattr(request, 'num_mcq', 5) 

    topic_instruction = f"\n\nFocus specifically on: {request.topic}" if request.topic else ""
    hint_instruction = '\n  "hint": "optional hint for the student",' if request.include_hints else ""

    difficulty_instruction = {
        DifficultyLevel.easy: "Focus on factual recall and basic comprehension.",
        DifficultyLevel.medium: "Mix recall with application and simple analysis.",
        DifficultyLevel.hard: "Emphasize analysis, evaluation, and edge cases.",
        DifficultyLevel.mixed: "Distribute evenly: 30% easy, 50% medium, 20% hard.",
    }.get(request.difficulty, "Mix recall with application and simple analysis.")

    return f"""Generate multiple-choice quiz questions from the lecture slides below.

Configuration:
- Language: {request.language}
- Difficulty: {request.difficulty} — {difficulty_instruction}
- Total MCQ questions: {total_questions}
- Include explanations: {request.include_explanations}{topic_instruction}

Topics from slides: {", ".join(slide_topics[:15])}

Slide Content:
{slides_content}

Return this EXACT JSON structure (no other text):
{{
  "topics_covered": ["topic1", "topic2"],
  "questions": [
    {{
      "id": "q1",
      "type": "mcq",
      "question": "Question text?",
      "topic": "Topic from slide heading",
      "slide_reference": "Slide 3",
      "difficulty": "medium",
      "marks": 1,
      "options": [
        {{"label": "A", "text": "Option text", "is_correct": false}},
        {{"label": "B", "text": "Option text", "is_correct": true}},
        {{"label": "C", "text": "Option text", "is_correct": false}},
        {{"label": "D", "text": "Option text", "is_correct": false}}
      ],
      "explanation": "B is correct because..."{hint_instruction}
    }}
  ]
}}"""


# ─── Main Generation ──────────────────────────────────────────────────────────

async def generate_quiz(
    slides: List[SlideContent],
    request: QuizGenerateRequest,
    filename: str,
) -> QuizResponse:
    """
    Generate a complete quiz from parsed slides using a single LLM call.
    """
    settings = get_settings()

    content_string = build_content_string(slides)
    slide_topics = [s.heading for s in slides if s.heading]
    user_prompt = build_user_prompt(content_string, request, slide_topics)

    try:
        response = await client.chat.completions.create(
            model=settings.primary_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.4,
            max_tokens=4000,
            response_format={"type": "json_object"},
        )
        raw_json = response.choices[0].message.content
    except Exception as e:
        raise HTTPException(502, f"OpenAI API error: {e}")

    # Parse and validate
    parsed = _parse_gpt_response(raw_json)
    questions = _build_question_objects(parsed.get("questions", []))

    total_marks = sum(q.marks for q in questions)
    total_qs = len(questions)
    est_minutes = total_qs * 2  # 2 mins per MCQ

    quiz_id = str(uuid.uuid4())
    return QuizResponse(
        id=quiz_id,
        title=request.title,
        source_file=filename,
        topic=request.topic or "General",
        total_questions=total_qs,
        total_marks=total_marks,
        estimated_duration_minutes=est_minutes,
        questions=questions,
        topics_covered=parsed.get("topics_covered", slide_topics[:10]),
        metadata={
            "num_slides": len(slides),
            "difficulty": request.difficulty,
            "language": request.language,
            "model_used": settings.primary_model,
            "mcq_count": total_qs,
        },
        created_at=datetime.utcnow().isoformat(),
    )


async def generate_quiz_stream(
    slides: List[SlideContent],
    request: QuizGenerateRequest,
    filename: str,
) -> AsyncGenerator[str, None]:
    """
    Stream the quiz generation. Yields Server-Sent Events.
    Yields individual questions as JSON as they are parsed from the stream.
    """
    settings = get_settings()

    content_string = build_content_string(slides)
    slide_topics = [s.heading for s in slides if s.heading]
    user_prompt = build_user_prompt(content_string, request, slide_topics)

    quiz_id = str(uuid.uuid4())

    # Send start event
    yield f"data: {json.dumps({'event': 'start', 'quiz_id': quiz_id, 'filename': filename})}\n\n"

    # Stream from OpenAI
    full_text = ""
    try:
        stream = await client.chat.completions.create(
            model=settings.primary_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            stream=True,
            temperature=0.4,
            max_tokens=4000,
            response_format={"type": "json_object"},
        )
    except Exception as e:
        yield f"data: {json.dumps({'event': 'error', 'message': str(e)})}\n\n"
        return

    questions_yielded = 0
    async for chunk in stream:
        delta = chunk.choices[0].delta.content or ""
        full_text += delta

        # Try to extract complete questions from partial JSON as they stream
        newly_found = _extract_complete_questions(full_text, questions_yielded)
        for q_data in newly_found:
            questions_yielded += 1
            try:
                q = _build_question_objects([q_data])[0]
                yield f"data: {json.dumps({'event': 'question', 'index': questions_yielded, 'question': q.model_dump()})}\n\n"
            except Exception:
                pass

    # Parse final complete response and send summary
    try:
        parsed = _parse_gpt_response(full_text)
        questions = _build_question_objects(parsed.get("questions", []))
        yield f"data: {json.dumps({'event': 'complete', 'quiz_id': quiz_id, 'total_questions': len(questions), 'topics_covered': parsed.get('topics_covered', [])})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'event': 'error', 'message': f'Failed to parse final response: {e}'})}\n\n"


# ─── Full Quiz LLM Grading ────────────────────────────────────────────────────

async def grade_quiz(
    quiz_questions: List[QuizQuestion],
    student_answers: List[StudentAnswer],
) -> dict:
    """
    Pass the exam questions and the student's answers into the LLM.
    The model evaluates the answers against the correct options and returns the score.
    """
    settings = get_settings()

    # Prep the data for the LLM
    questions_data = [
        {
            "id": q.id,
            "question": q.question,
            "options": [{"label": o.label, "text": o.text, "is_correct": o.is_correct} for o in (q.options or [])],
            "marks_available": q.marks
        } 
        for q in quiz_questions
    ]
    
    answers_data = [
        {
            "question_id": a.question_id,
            "student_answer": a.answer
        } 
        for a in student_answers
    ]

    prompt = f"""You are an automated grading assistant. Evaluate the student's answers against the correct quiz options.

Quiz Questions & Correct Answers:
{json.dumps(questions_data, indent=2)}

Student's Answers:
{json.dumps(answers_data, indent=2)}

Task:
Match each student answer to the corresponding question. Determine if it is correct based on the provided options. Calculate the total marks earned, the total marks available, and the percentage score.

Return ONLY this EXACT JSON structure:
{{
  "score_pct": <number between 0 and 100>,
  "marks_earned": <number>,
  "marks_available": <number>,
  "results": [
    {{
      "question_id": "string",
      "is_correct": true/false,
      "marks_earned": <number>
    }}
  ]
}}"""

    # Call the LLM to grade
    try:
        response = await client.chat.completions.create(
            model=settings.primary_model,
            messages=[
                {"role": "system", "content": "You are a precise grading system. You only output valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,  # Low temperature for strict, deterministic evaluation
            response_format={"type": "json_object"},
        )
        raw_result = response.choices[0].message.content
        return _parse_gpt_response(raw_result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to grade exam via LLM: {str(e)}")


# ─── Private helpers ──────────────────────────────────────────────────────────

def _parse_gpt_response(raw: str) -> dict:
    """Safely parse JSON from GPT response, stripping markdown fences."""
    cleaned = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        # Attempt to extract partial JSON
        match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except Exception:
                pass
        raise HTTPException(500, f"Failed to parse GPT response as JSON: {e}\n\nRaw output:\n{raw[:500]}")


def _build_question_objects(raw_questions: list) -> List[QuizQuestion]:
    """Convert raw dicts from GPT into validated QuizQuestion objects."""
    questions = []
    for i, q in enumerate(raw_questions):
        q_id = q.get("id") or f"q{i + 1}"

        # Build options for MCQ
        options = None
        if q.get("options"):
            options = [
                MCQOption(
                    label=opt.get("label", ""),
                    text=opt.get("text", ""),
                    is_correct=bool(opt.get("is_correct", False)),
                )
                for opt in q["options"]
            ]

        questions.append(QuizQuestion(
            id=q_id,
            type=QuestionType.mcq,
            question=q.get("question", ""),
            topic=q.get("topic", ""),
            difficulty=DifficultyLevel(q.get("difficulty", "medium")) if q.get("difficulty") in DifficultyLevel.__members__.values() else DifficultyLevel.medium,
            marks=int(q.get("marks", 1)),
            options=options,
            explanation=q.get("explanation", ""),
            hint=q.get("hint"),
            slide_reference=q.get("slide_reference"),
        ))

    return questions


def _extract_complete_questions(partial_json: str, already_yielded: int) -> list:
    """
    Extract complete question objects from partially-streamed JSON.
    Used during streaming to yield questions as they arrive.
    """
    found = []
    # Look for complete {...} objects after the "questions" array opening
    pattern = r'\{[^{}]*"id"\s*:\s*"[^"]*"[^{}]*\}'
    matches = re.findall(pattern, partial_json, re.DOTALL)

    for match in matches[already_yielded:]:
        try:
            found.append(json.loads(match))
        except Exception:
            pass

    return found