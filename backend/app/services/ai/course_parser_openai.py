import os
from typing import Any, Dict
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

COURSE_SCHEMA: Dict[str, Any] = {
    "name": "course_extraction",
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "outline_description": {"type": "string"},
            "instructor": {"type": "string"},
            "components": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "name": {"type": "string"},
                        "weight": {"type": "number", "minimum": 0, "maximum": 1}
                    },
                    "required": ["name", "weight"]
                }
            },
            "topics": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "title": {"type": "string"},
                        "parent_title": {"type": ["string", "null"]},
                        "order_index": {"type": "integer", "minimum": 1}
                    },
                    "required": ["title", "parent_title", "order_index"]
                }
            }
        },
        "required": ["outline_description", "instructor", "components", "topics"]
    }
}


def extract_course_from_file(file_path: str, course_code: str) -> Dict[str, Any]:
    """
    Sends a PDF/PPTX/DOCX file to OpenAI and returns structured JSON:
    outline + grading components + topic hierarchy.
    """
    with open(file_path, "rb") as f:
        uploaded = client.files.create(file=f, purpose="assistants")

    # Responses API supports using a file_id as input_file. :contentReference[oaicite:1]{index=1}
    resp = client.responses.create(
        model="gpt-4o",  # you can swap to your allowed model
        input=[
            {
                "role": "system",
                "content": (
                    "You extract course structure from course documents. "
                    "Return only JSON that matches the provided schema."
                ),
            },
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": f"Extract the structure for course {course_code}."},
                    {"type": "input_file", "file_id": uploaded.id},
                ],
            },
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": COURSE_SCHEMA["name"],
                "schema": COURSE_SCHEMA["schema"],
            }
        },
    )
    # The SDK returns structured output in resp.output_text as JSON text for text.format. :contentReference[oaicite:2]{index=2}
    import json
    return json.loads(resp.output_text)