from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.schemas import QuizGenerateRequest, QuizResponse, QuizQuestion, StudentAnswer
from app.services.ai.quiz_services import generate_quiz_from_slides, grade_and_record_quiz
from app.services.file_parser import SlideContent

router = APIRouter(prefix="/ai/quiz", tags=["AI Quiz Generation"])


class QuizGenerateBody(BaseModel):
    """Combined body for quiz generation"""
    slides: List[SlideContent]
    request: QuizGenerateRequest = QuizGenerateRequest()


class QuizGradeBody(BaseModel):
    """Combined body for quiz grading"""
    quiz_questions: List[QuizQuestion]
    student_answers: List[StudentAnswer]


@router.post("/generate", response_model=QuizResponse)
async def create_quiz(body: QuizGenerateBody):
    """Generate a quiz from slide content"""
    return await generate_quiz_from_slides(body.slides, body.request, "lecture.pdf")


@router.post("/grade")
async def grade_submission(body: QuizGradeBody):
    """Grade student answers for a quiz"""
    return await grade_and_record_quiz(body.quiz_questions, body.student_answers)