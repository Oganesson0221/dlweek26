# services/ai/concept_map.py (Simplified)
import httpx
from app.core.config import get_settings
from app.services.file_parser import SlideContent, build_content_string
from app.services.ai.prompt_banks import CONCEPT_MAP_VISUALIZATION_PROMPT
from app.services.ai.openai_key import get_ai_client
from fastapi import HTTPException
from typing import List

# Client is lazy-loaded via get_ai_client()

from typing import List
from fastapi import HTTPException

async def generate_concept_map_bytes(slides: List[SlideContent], filename: str) -> bytes:
    """
    Generates a terminology concept map (cn1, cn2, ...) from slides and returns raw UTF-8 bytes.
    """
    settings = get_settings()
    client = get_ai_client()
    content_string = build_content_string(slides)

    prompt = f"{CONCEPT_MAP_VISUALIZATION_PROMPT}\n\nSlide Content:\n{content_string}"

    try:
        # Text generation using chat completions
        resp = await client.chat.completions.create(
            model=settings.DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert at extracting terminology and concepts from educational content."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
        )

        text = (resp.choices[0].message.content or "").strip()
        if not text:
            raise HTTPException(502, "Model returned empty output.")
        
        # Remove markdown code fences if present
        if text.startswith("```"):
            text = text.replace("```javascript\n", "").replace("```js\n", "").replace("```\n", "").replace("\n```", "").strip()
        
        # Debug preview (first 500 chars)
        preview = text[:500].replace("\n", " ")
        print(f"[Concept Map] Generated {len(text)} chars. Preview: {preview}")

        if "cn1" not in text or "term" not in text:
            raise HTTPException(
                502,
                f"Model output did not match expected cnX format. Preview: {preview}"
            )

        return text.encode("utf-8")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502, f"Error generating concept map bytes: {e}")