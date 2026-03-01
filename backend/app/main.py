from fastapi import FastAPI
import os

from app.core.config import settings
from app.core.cors import setup_cors
from app.core.logging import setup_logging
from app.db.init_db import init_db

# Backend 2 routers
from app.routers.academic.courses import router as courses_router
from app.routers.academic.submissions import router as submissions_router
from app.routers.academic.templates import router as templates_router
from app.routers.academic.deadlines import router as deadlines_router
from app.routers.academic.copilot_hooks import router as copilot_router


def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME)

    # Setup
    setup_logging()
    setup_cors(app)

    # Ensure storage folders exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.GENERATED_DIR, exist_ok=True)
    os.makedirs(settings.IMAGE_DIR, exist_ok=True)

    @app.on_event("startup")
    def on_startup():
        init_db()

    # Health check
    @app.get("/health")
    def health():
        return {"status": "ok"}

    # Mount Backend 2
    app.include_router(courses_router)
    app.include_router(submissions_router)
    app.include_router(templates_router)
    app.include_router(deadlines_router)
    app.include_router(copilot_router)

    return app


app = create_app()