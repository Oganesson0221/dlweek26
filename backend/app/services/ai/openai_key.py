import os
from pathlib import Path
from dotenv import load_dotenv
from openai import AsyncOpenAI

# Find .env file in project root
def find_env_file():
    current = Path(__file__).resolve().parent
    for _ in range(5):  # Search up 5 levels
        env_path = current / ".env"
        if env_path.exists():
            return str(env_path)
        current = current.parent
    return None

# Load global environment variables (e.g., OPENAI_API_KEY)
env_file = find_env_file()
if env_file:
    load_dotenv(env_file)

# Centralized client instance - lazy initialization
_client = None

def get_ai_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set in environment")
        _client = AsyncOpenAI(api_key=api_key)
    return _client