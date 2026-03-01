import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Study Navigator API"
    ENV: str = os.getenv("ENV", "dev")

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./study_navigator.db")

    STORAGE_ROOT: str = "./storage"
    UPLOAD_DIR: str = "./storage/uploads"
    GENERATED_DIR: str = "./storage/generated"
    IMAGE_DIR: str = "./storage/images"

    REMINDER_LEADS_HOURS: list[int] = [72, 24, 6]


settings = Settings()