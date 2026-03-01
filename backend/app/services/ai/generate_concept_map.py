# services/ai/concept_map.py (Simplified)
import httpx
from app.core.config import get_settings
from app.services.file_parser import SlideContent, build_content_string
from app.services.ai.prompt_banks import CONCEPT_MAP_VISUALIZATION_PROMPT
from fastapi import HTTPException
from openai import AsyncOpenAI
from typing import List

client = AsyncOpenAI() # Will auto-detect from OPENAI_API_KEY in env

async def generate_concept_map_bytes(slides: List[SlideContent], filename: str) -> bytes:
    """
    Generates a visual concept map image from slides and returns the raw image bytes.
    Utilizes gpt-4o via the image generation API.
    """
    settings = get_settings()
    content_string = build_content_string(slides)
    prompt = f"{CONCEPT_MAP_VISUALIZATION_PROMPT}\n\nSlide Content:\n{content_string}"

    try:
        # Step 1: Request image generation from gpt-4o 
        # (This uses the schematic Images endpoint which gpt-4o can populate)
        response = await client.images.generate(
            model="gpt-4o", # Ensure this is gpt-4o for best visualization
            prompt=prompt,
            n=1,
            size="1024x1024", # Or another supported size
            response_format="url", 
        )
        temporary_image_url = response.data[0].url

        # Step 2: Download only the image bytes
        async with httpx.AsyncClient() as http_client:
            image_response = await http_client.get(temporary_image_url)
            return image_response.content # Return *only* bytes, no metadata
    except Exception as e:
        # Keep consistent error handling
        raise HTTPException(502, f"Error generating map image bytes: {e}")