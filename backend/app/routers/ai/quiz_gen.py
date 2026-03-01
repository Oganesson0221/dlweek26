from fastapi import APIRouter, Depends
from typing import List
from app.schemas import QuizGenerateRequest, QuizResponse, QuizQuestion, StudentAnswer
from app.services.ai.quiz_services import generate_quiz_from_slides, grade_and_record_quiz
from app.services.file_parser import SlideContent

router = APIRouter(prefix="/ai/quiz", tags=["AI Quiz Generation"])

@router.post("/generate", response_model=QuizResponse)
async def create_quiz(request: QuizGenerateRequest, slides: List[SlideContent]):
    # In a real scenario, you might extract 'slides' from a file upload dependency
    return await generate_quiz_from_slides(slides, request, "lecture.pdf")

@router.post("/grade")
async def grade_submission(questions: List[QuizQuestion], answers: List[StudentAnswer]):
    return await grade_and_record_quiz(questions, answers)