import os
from dotenv import load_dotenv
from openai import AsyncOpenAI

# Load global environment variables (e.g., OPENAI_API_KEY)
load_dotenv()

# Centralized client instance
client = AsyncOpenAI()

def get_ai_client() -> AsyncOpenAI:
    return client