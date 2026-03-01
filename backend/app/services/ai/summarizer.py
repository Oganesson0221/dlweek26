from typing import List
from app.core.config import get_settings
from app.services.ai.openai_key import get_ai_client
from app.services.file_parser import SlideContent, build_content_string
from app.services.ai.quiz_services import _parse_gpt_response

client = get_ai_client()

async def generate_summary(slides: List[SlideContent]) -> str:
    settings = get_settings()
    prompt = f"Summarize these slides into a cohesive overview paragraph:\n{build_content_string(slides)}"
    response = await client.chat.completions.create(
        model=settings.primary_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()

async def extract_key_points(slides: List[SlideContent]) -> List[str]:
    settings = get_settings()
    prompt = f"Extract core key points from these slides. Return EXACT JSON: {{'key_points': ['point 1']}}:\n{build_content_string(slides)}"
    response = await client.chat.completions.create(
        model=settings.primary_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    return _parse_gpt_response(response.choices[0].message.content).get("key_points", [])