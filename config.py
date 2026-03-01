import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # OpenAI settings
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    OPENAI_ORG_ID = os.getenv('OPENAI_ORG_ID')
    
    # Model settings
    MODEL_NAME = "gpt-3.5-turbo"  # Default model
    MAX_TOKENS = 150
    TEMPERATURE = 0.7
    
    @classmethod
    def validate(cls):
        """Check if required environment variables are set"""
        if not cls.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        if not cls.OPENAI_ORG_ID:
            raise ValueError("OPENAI_ORG_ID not found in environment variables")
        return True