from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from enum import Enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class QuestionType(str, Enum):
    mcq = "mcq"                    # Multiple choice (1 correct answer)
    multi_select = "multi_select"  # Multiple choice (multiple correct)
    true_false = "true_false"      # True / False
    open_ended = "open_ended"      # Free-text answer, AI graded
    fill_blank = "fill_blank"      # Complete the sentence

class DifficultyLevel(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"
    mixed = "mixed"


# ─── Quiz Generation Request ──────────────────────────────────────────────────

class QuizGenerateRequest(BaseModel):
    """
    Query parameters sent alongside the file upload.
    All fields are optional — sensible defaults are applied.
    """
    title: str = Field(default="Quiz", description="Name for this quiz")
    topic: Optional[str] = Field(default=None, description="Optional topic focus, e.g. 'Chapter 3 only'")

    num_mcq: int = Field(default=5, ge=0, le=30, description="Number of MCQ questions")
    num_open_ended: int = Field(default=3, ge=0, le=20, description="Number of open-ended questions")
    num_true_false: int = Field(default=2, ge=0, le=10, description="Number of True/False questions")
    num_fill_blank: int = Field(default=0, ge=0, le=10, description="Number of fill-in-the-blank questions")

    difficulty: DifficultyLevel = Field(default=DifficultyLevel.mixed)
    language: str = Field(default="English", description="Language for questions")
    include_explanations: bool = Field(default=True, description="Add answer explanations to each question")
    include_hints: bool = Field(default=False, description="Add hints for open-ended questions")


# ─── Question Models ──────────────────────────────────────────────────────────

class MCQOption(BaseModel):
    label: str          # "A", "B", "C", "D"
    text: str           # Option content
    is_correct: bool


class QuizQuestion(BaseModel):
    id: str
    type: QuestionType
    question: str
    topic: str = ""             # Which topic/slide this came from
    difficulty: DifficultyLevel = DifficultyLevel.medium
    marks: int = 1

    # MCQ / multi_select / true_false
    options: Optional[List[MCQOption]] = None

    # open_ended / fill_blank
    model_answer: Optional[str] = None
    marking_criteria: Optional[str] = None  # rubric for grading

    explanation: str = ""
    hint: Optional[str] = None
    slide_reference: Optional[str] = None  # e.g. "Slide 5"


# ─── Quiz Response ─────────────────────────────────────────────────────────

class QuizResponse(BaseModel):
    id: str
    title: str
    source_file: str
    topic: str
    total_questions: int
    total_marks: int
    estimated_duration_minutes: int
    questions: List[QuizQuestion]
    topics_covered: List[str]
    metadata: dict
    created_at: str


# ─── Grading ──────────────────────────────────────────────────────────────────

class StudentAnswer(BaseModel):
    question_id: str
    answer: str   # For MCQ: "A" or "A,C" for multi. For open: free text. For T/F: "True"/"False"


class GradeRequest(BaseModel):
    quiz_id: str
    answers: List[StudentAnswer]


class QuestionResult(BaseModel):
    question_id: str
    question: str
    type: QuestionType
    your_answer: str
    correct_answer: str
    is_correct: bool
    marks_earned: float
    marks_available: int
    feedback: str
    explanation: str


class GradeResponse(BaseModel):
    attempt_id: str
    quiz_id: str
    score_pct: float
    marks_earned: float
    marks_available: int
    grade_letter: str
    results: List[QuestionResult]
    topic_breakdown: dict   # {topic: {correct: int, total: int, pct: float}}
    weak_topics: List[str]
    strong_topics: List[str]
    overall_feedback: str