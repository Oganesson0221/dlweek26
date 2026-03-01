import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="allow")

    APP_NAME: str = "Study Navigator API"
    ENV: str = os.getenv("ENV", "dev")

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./study_navigator.db")

    STORAGE_ROOT: str = "./storage"
    UPLOAD_DIR: str = "./storage/uploads"
    GENERATED_DIR: str = "./storage/generated"
    IMAGE_DIR: str = "./storage/images"
    OPENAI_API_KEY: str | None = None
    DEFAULT_MODEL: str = "gpt-4.1"
    TEMPERATURE: float = 0.2
    REMINDER_LEADS_HOURS: list[int] = [72, 24, 6]
    
    # AI Settings
    primary_model: str = os.getenv("PRIMARY_MODEL", "gpt-4o")


settings = Settings()


def get_settings() -> Settings:
    return settings