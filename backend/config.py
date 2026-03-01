# import os
# from dotenv import load_dotenv
# from pathlib import Path

# # Load environment variables
# load_dotenv()

# class Config:
#     # OpenAI settings
#     OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
#     OPENAI_ORG_ID = os.getenv('OPENAI_ORG_ID')
    
#     # Model settings
#     DEFAULT_MODEL = os.getenv('DEFAULT_MODEL')
#     VISION_MODEL = os.getenv('VISION_MODEL')
#     MAX_TOKENS = int(os.getenv('MAX_TOKENS', 1000))
#     TEMPERATURE = float(os.getenv('TEMPERATURE', 0.7))
    
#     # Paths
#     BASE_DIR = Path(__file__).parent
#     IMAGE_DIR = BASE_DIR / 'images'
    
#     @classmethod
#     def validate(cls):
#         """Check if required environment variables are set"""
#         if not cls.OPENAI_API_KEY:
#             raise ValueError("OPENAI_API_KEY not found in environment variables")
#         if not cls.OPENAI_ORG_ID:
#             raise ValueError("OPENAI_ORG_ID not found in environment variables")
        
#         # Create image directory if it doesn't exist
#         cls.IMAGE_DIR.mkdir(exist_ok=True)
#         return True

from pydantic import BaseModel
import os

class Settings(BaseModel):
    env: str = os.getenv("ENV", "dev")
    db_url: str = os.getenv("DB_URL", "sqlite:///./app.db")

    # Azure OpenAI (optional)
    azure_openai_endpoint: str = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    azure_openai_api_key: str = os.getenv("AZURE_OPENAI_API_KEY", "")
    azure_openai_deployment: str = os.getenv("AZURE_OPENAI_DEPLOYMENT", "")
    azure_openai_api_version: str = os.getenv("AZURE_OPENAI_API_VERSION", "2024-10-21")

    # Toggle mock mode
    use_mock_ai: bool = os.getenv("USE_MOCK_AI", "true").lower() == "true"

settings = Settings()