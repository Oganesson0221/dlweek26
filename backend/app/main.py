from fastapi import FastAPI
import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.cors import setup_cors
from app.core.logging import setup_logging

# MongoDB routers for academic features
from app.routers.academic.courses_mongo import router as courses_router
from app.routers.academic.submissions_mongo import router as submissions_router
from app.routers.academic.templates_mongo import router as templates_router
from app.routers.academic.deadlines_mongo import router as deadlines_router
from app.routers.academic.copilot_hooks_mongo import router as copilot_router
from app.routers.academic.progress_mongo import router as progress_router
from app.routers.academic.editor_mongo import router as editor_router

# AI routers
from app.routers.ai.course_tools import router as course_tools_router
from app.routers.ai.improving import router as improving_router
from app.routers.ai.quiz_gen import router as quiz_gen_router
from app.routers.ai.file_upload import router as file_upload_router

# Notes router (MongoDB)
from app.routers.notes import router as notes_router


def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME)

    # Setup
    setup_logging()
    setup_cors(app)

    # Ensure storage folders exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.GENERATED_DIR, exist_ok=True)
    os.makedirs(settings.IMAGE_DIR, exist_ok=True)

    # Health check
    @app.get("/health")
    def health():
        return {"status": "ok"}

    # Mount Academic routers (MongoDB versions)
    # Note: These routers have their own internal prefixes (e.g., "/academic/courses")
    app.include_router(courses_router, prefix="/academic/courses")          # Has prefix="/academic/courses"
    app.include_router(submissions_router, prefix="/academic/submissions")
    app.include_router(templates_router, prefix="/academic/templates")
    app.include_router(deadlines_router, prefix="/academic/deadlines")
    app.include_router(copilot_router, prefix="/academic/copilot")
    app.include_router(progress_router, prefix="/academic/progress")
    app.include_router(editor_router, prefix="/academic/editor")

    # Mount AI routers - these have their own internal prefixes
    app.include_router(course_tools_router, prefix="/ai/tools")     # Has prefix="/ai/tools"
    app.include_router(improving_router, prefix="/ai/improve")        # Has prefix="/ai/improve"
    app.include_router(quiz_gen_router, prefix="/ai/quiz")         # Has prefix="/ai/quiz"
    app.include_router(file_upload_router, prefix="/ai/files")  # Prefix here instead


    # Mount Notes router - has prefix="/notes"
    app.include_router(notes_router, prefix="/notes")

    return app


app = create_app()