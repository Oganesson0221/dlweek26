from fastapi import APIRouter
from typing import List, Dict
from app.services.ai.summarizer import generate_summary, extract_key_points
from app.services.ai.generate_concept_map import generate_concept_map_bytes
from app.core.config import get_settings
from app.services.file_parser import build_content_string, SlideContent
from app.services.ai.openai_key import get_ai_client
from fastapi import HTTPException
import re
import json

# Client is lazy-loaded via get_ai_client()

router = APIRouter(prefix="/ai/tools", tags=["AI Course Tools"])

@router.post("/summary", response_model=str)
async def get_summary(slides: List[SlideContent]):
    return await generate_summary(slides)

@router.post("/key-points", response_model=List[str])
async def get_key_points(slides: List[SlideContent]):
    return await extract_key_points(slides)

@router.post("/concepts", response_model=List[Dict[str, str]])
async def get_concepts(slides: List[SlideContent]):
    return await generate_concepts(slides)

# ─── Main Functions ───────────────────────────────────────────────────────────

async def generate_summary(slides: List[SlideContent]) -> str:
    """
    Reads the parsed slides and generates a cohesive, high-level summary paragraph.
    """
    settings = get_settings()
    client = get_ai_client()
    content_string = build_content_string(slides)

    prompt = f"""You are an expert academic tutor.
Summarize the following lecture slides into a clear, concise, and cohesive overview paragraph. 
Capture the main narrative and primary objective of the presentation.

Slide Content:
{content_string}
"""

    try:
        response = await client.chat.completions.create(
            model=settings.primary_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1000,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(502, f"OpenAI API error during summarization: {e}")


async def extract_key_points(slides: List[SlideContent]) -> List[str]:
    """
    Extracts the most important bullet points from the slides.
    Returns a list of strings.
    """
    settings = get_settings()
    client = get_ai_client()
    content_string = build_content_string(slides)

    prompt = f"""You are an expert academic tutor.
Extract the core key points from the following lecture slides. 
Focus on actionable takeaways, main arguments, and critical facts.

Slide Content:
{content_string}

Return ONLY this EXACT JSON structure:
{{
  "key_points": [
    "First major takeaway...",
    "Second major takeaway..."
  ]
}}"""

    try:
        response = await client.chat.completions.create(
            model=settings.primary_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        raw_result = response.choices[0].message.content
        parsed = _parse_gpt_response(raw_result)
        return parsed.get("key_points", [])
    except Exception as e:
        raise HTTPException(502, f"OpenAI API error during key point extraction: {e}")


async def generate_concepts(slides: List[SlideContent]) -> List[Dict[str, str]]:
    """
    Identifies key terminology/concepts from the slides and defines them.
    Returns a list of dictionaries containing 'term' and 'definition'.
    """
    settings = get_settings()
    client = get_ai_client()
    content_string = build_content_string(slides)

    prompt = f"""You are an expert academic tutor.
Identify the most important technical terms, concepts, or jargon used in the following lecture slides.
Provide a clear, accurate definition for each based specifically on how it is used in the slides.

Slide Content:
{content_string}

Return ONLY this EXACT JSON structure:
{{
  "concepts": [
    {{
      "term": "Term Name",
      "definition": "Clear definition based on the slides."
    }}
  ]
}}"""

    try:
        response = await client.chat.completions.create(
            model=settings.primary_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        raw_result = response.choices[0].message.content
        parsed = _parse_gpt_response(raw_result)
        return parsed.get("concepts", [])
    except Exception as e:
        raise HTTPException(502, f"OpenAI API error during concept generation: {e}")


# ─── Private Helpers ──────────────────────────────────────────────────────────

def _parse_gpt_response(raw: str) -> dict:
    """Safely parse JSON from GPT response, stripping markdown fences."""
    cleaned = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        # Attempt to extract partial JSON if fences were malformed
        match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except Exception:
                pass
        raise HTTPException(500, f"Failed to parse GPT response as JSON: {e}\n\nRaw output:\n{raw[:500]}")