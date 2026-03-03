from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.schemas import QuizGenerateRequest, QuizResponse, QuizQuestion, StudentAnswer
from app.services.ai.quiz_services import generate_quiz_from_slides, grade_and_record_quiz
from app.services.file_parser import SlideContent

router = APIRouter(tags=["AI Quiz Generation"])


class QuizGenerateBody(BaseModel):
    """Combined body for quiz generation"""
    slides: List[SlideContent]
    request: QuizGenerateRequest = QuizGenerateRequest()


class QuizGradeBody(BaseModel):
    """Combined body for quiz grading"""
    quiz_questions: List[QuizQuestion]
    student_answers: List[StudentAnswer]
    quiz_id: Optional[str] = None
    course_code: Optional[str] = None
    time_spent_minutes: int = 0
    user_id: str = "default"


@router.post("/generate", response_model=QuizResponse)
async def create_quiz(body: QuizGenerateBody):
    """Generate a quiz from slide content"""
    return await generate_quiz_from_slides(body.slides, body.request, "lecture.pdf")


@router.post("/grade")
async def grade_submission(body: QuizGradeBody):
    """Grade student answers for a quiz and save result to MongoDB"""
    return await grade_and_record_quiz(
        quiz_questions=body.quiz_questions, 
        student_answers=body.student_answers,
        quiz_id=body.quiz_id,
        course_code=body.course_code,
        time_spent_minutes=body.time_spent_minutes,
        user_id=body.user_id
    )