import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

class Config:
    # OpenAI settings
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    OPENAI_ORG_ID = os.getenv('OPENAI_ORG_ID')
    
    # Model settings
    DEFAULT_MODEL = os.getenv('DEFAULT_MODEL', 'gpt-4')
    VISION_MODEL = os.getenv('VISION_MODEL', 'gpt-4-vision-preview')
    MAX_TOKENS = int(os.getenv('MAX_TOKENS', 1000))
    TEMPERATURE = float(os.getenv('TEMPERATURE', 0.7))
    
    # Paths
    BASE_DIR = Path(__file__).parent
    IMAGE_DIR = BASE_DIR / 'images'
    
    @classmethod
    def validate(cls):
        """Check if required environment variables are set"""
        if not cls.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        if not cls.OPENAI_ORG_ID:
            raise ValueError("OPENAI_ORG_ID not found in environment variables")
        
        # Create image directory if it doesn't exist
        cls.IMAGE_DIR.mkdir(exist_ok=True)
        return True