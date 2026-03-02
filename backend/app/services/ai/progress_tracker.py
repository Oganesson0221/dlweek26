"""
AI-powered progress tracking service for assignments.
Tracks completion of template sections and provides scoring metrics.
"""
import os
import json
import re
from typing import Dict, List, Any, Optional
import httpx
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API", getattr(settings, "OPENROUTER_API", ""))
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


def _analyze_content_locally(template_structure: Dict[str, Any], content: str) -> Dict[str, Any]:
    """
    Local analysis based on actual content - no hardcoded values.
    """
    sections = template_structure.get("sections", [])
    section_results = []
    total_progress = 0
    
    content_lower = content.lower().strip()
    content_words = len(content.split()) if content.strip() else 0
    
    # If no content, return empty progress
    if not content_words:
        for section in sections:
            section_results.append({
                "name": section.get("name", "Section"),
                "status": "not_started",
                "completion_percent": 0,
                "feedback": f"Start writing {section.get('name', 'this section')}"
            })
        return {
            "overall_progress": 0,
            "sections": section_results,
            "strengths": [],
            "improvements": ["Start writing your assignment"],
            "estimated_score": None,
            "rubric_breakdown": None
        }
    
    for section in sections:
        section_name = section.get("name", "Section")
        section_name_lower = section_name.lower()
        
        # Check if section header or content exists
        header_patterns = [
            f"## {section_name_lower}",
            f"# {section_name_lower}",
            f"{section_name_lower}:",
            f"**{section_name_lower}**",
            section_name_lower,  # Just the word itself
        ]
        
        has_section = any(pattern in content_lower for pattern in header_patterns)
        
        if has_section:
            # Find the section content
            section_word_count = 0
            for pattern in header_patterns:
                if pattern in content_lower:
                    idx = content_lower.find(pattern)
                    # Get content after this section header until next section or end
                    section_end = len(content)
                    for other_section in sections:
                        other_name = other_section.get("name", "").lower()
                        if other_name != section_name_lower:
                            for p in [f"## {other_name}", f"# {other_name}", f"{other_name}:"]:
                                other_idx = content_lower.find(p, idx + len(pattern))
                                if other_idx > idx and other_idx < section_end:
                                    section_end = other_idx
                    
                    section_content = content[idx:section_end]
                    section_word_count = len(section_content.split())
                    break
            
            # Calculate completion based on word count
            if section_word_count >= 100:
                status = "completed"
                completion = 100
            elif section_word_count >= 50:
                status = "completed"
                completion = 90
            elif section_word_count >= 30:
                status = "in_progress"
                completion = 70
            elif section_word_count >= 15:
                status = "in_progress"
                completion = 50
            elif section_word_count >= 5:
                status = "in_progress"
                completion = 30
            else:
                status = "in_progress"
                completion = 10
        else:
            status = "not_started"
            completion = 0
        
        section_results.append({
            "name": section_name,
            "status": status,
            "completion_percent": completion,
            "feedback": f"{'Good progress on' if status == 'completed' else 'Continue working on'} {section_name}" if completion > 0 else f"Start writing {section_name}"
        })
        total_progress += completion
    
    # Calculate overall progress
    avg_progress = total_progress // len(section_results) if section_results else 0
    
    # Generate dynamic strengths and improvements
    strengths = []
    improvements = []
    
    if content_words >= 300:
        strengths.append("Substantial content written")
    elif content_words >= 150:
        strengths.append("Good amount of content")
    elif content_words >= 50:
        strengths.append("Content started")
    
    completed_sections = [s for s in section_results if s["status"] == "completed"]
    if completed_sections:
        strengths.append(f"{len(completed_sections)} section(s) completed")
    
    in_progress_sections = [s for s in section_results if s["status"] == "in_progress"]
    if in_progress_sections:
        for s in in_progress_sections:
            improvements.append(f"Expand {s['name']} section")
    
    not_started_sections = [s for s in section_results if s["status"] == "not_started"]
    if not_started_sections:
        for s in not_started_sections:
            improvements.append(f"Add {s['name']} section")
    
    if not strengths:
        strengths.append("Assignment started")
    if not improvements:
        improvements.append("Keep refining your content")
    
    return {
        "overall_progress": avg_progress,
        "sections": section_results,
        "strengths": strengths if strengths else ["Started working on assignment"],
        "improvements": improvements if improvements else ["Keep adding content"],
        "estimated_score": None,
        "rubric_breakdown": None
    }


async def analyze_progress(
    template_structure: Dict[str, Any],
    current_content: str,
    rubric: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Analyze student's progress on an assignment template.
    
    Args:
        template_structure: The original template with sections to fill
        current_content: The student's current work
        rubric: Optional rubric criteria for scoring
    
    Returns:
        Progress analysis with section completion and scores
    """
    rubric_text = ""
    if rubric:
        rubric_text = "\n".join([
            f"- {r.get('criteria', 'Unknown')}: {r.get('points', 0)} points - {r.get('description', '')}"
            for r in rubric
        ])
    
    system_prompt = """You are an academic progress analyzer. Analyze student work against assignment requirements.
    
Return a JSON object with this structure:
{
    "overall_progress": number (0-100),
    "sections": [
        {
            "name": "section name",
            "status": "not_started" | "in_progress" | "completed",
            "completion_percent": number (0-100),
            "feedback": "brief feedback on this section"
        }
    ],
    "strengths": ["list of strengths"],
    "improvements": ["list of areas to improve"],
    "estimated_score": number (optional, if rubric provided),
    "rubric_breakdown": [
        {
            "criteria": "criteria name",
            "estimated_points": number,
            "max_points": number,
            "feedback": "feedback on this criteria"
        }
    ]
}"""

    user_prompt = f"""Analyze the following student work for completion and quality.

TEMPLATE STRUCTURE:
{json.dumps(template_structure, indent=2)}

STUDENT'S CURRENT WORK:
{current_content}

{f"RUBRIC CRITERIA:{chr(10)}{rubric_text}" if rubric_text else ""}

Analyze the progress and provide detailed feedback."""

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "LearnLens Progress Tracker"
                },
                json={
                    "model": "openai/gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.3,
                    "response_format": {"type": "json_object"}
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "{}")
                parsed = json.loads(content)
                # Validate the response has required fields
                if parsed.get("overall_progress") is not None:
                    return parsed
                else:
                    logger.warning("AI response missing required fields, using fallback")
                    return _analyze_content_locally(template_structure, current_content)
            else:
                logger.warning(f"OpenRouter API error: {response.status_code}")
                return _analyze_content_locally(template_structure, current_content)
    except Exception as e:
        logger.error(f"Error analyzing progress: {e}")
        return _analyze_content_locally(template_structure, current_content)


async def generate_email_draft(
    assignment: Dict[str, Any],
    instructor_name: str,
    instructor_email: Optional[str] = None,
    student_name: str = "Student",
    email_type: str = "submission_confirmation"
) -> Dict[str, str]:
    """
    Generate a professional email draft for professor communication.
    
    Args:
        assignment: Assignment details
        instructor_name: Professor's name
        instructor_email: Professor's email (optional)
        student_name: Student's name
        email_type: Type of email (submission_confirmation, question, extension_request)
    
    Returns:
        Dict with subject and body
    """
    
    email_contexts = {
        "submission_confirmation": "confirming submission of an assignment",
        "question": "asking a clarifying question about the assignment",
        "extension_request": "requesting a deadline extension",
        "feedback_request": "requesting feedback on work in progress"
    }
    
    context = email_contexts.get(email_type, "general communication about an assignment")
    
    system_prompt = """You are a professional academic email writer. Write concise, formal but friendly emails.

Return a JSON object:
{
    "subject": "email subject line",
    "body": "email body content"
}

Guidelines:
- Be respectful and professional
- Be concise - professors are busy
- Include relevant details
- Use proper salutation and closing
- Keep tone polite but not overly formal"""

    user_prompt = f"""Write a professional email {context}.

ASSIGNMENT DETAILS:
- Title: {assignment.get('title', 'Assignment')}
- Course: {assignment.get('course_code', 'Course')}
- Due Date: {assignment.get('due_at', 'N/A')}
- Description: {assignment.get('description', 'N/A')[:200]}

TO: Professor {instructor_name}
FROM: {student_name}

Generate a professional email for {email_type.replace('_', ' ')}."""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "LearnLens Email Generator"
                },
                json={
                    "model": "openai/gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.5,
                    "response_format": {"type": "json_object"}
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "{}")
                return json.loads(content)
            else:
                # Fallback template
                return {
                    "subject": f"Submission Confirmation: {assignment.get('title', 'Assignment')} ({assignment.get('course_code', 'Course')})",
                    "body": f"""Dear Professor {instructor_name},

I am writing to confirm that I have submitted "{assignment.get('title', 'the assignment')}" for {assignment.get('course_code', 'the course')}.

Please let me know if you need any additional information or if there are any issues with my submission.

Thank you for your time.

Best regards,
{student_name}"""
                }
    except Exception as e:
        return {
            "subject": f"Submission Confirmation: {assignment.get('title', 'Assignment')}",
            "body": f"""Dear Professor {instructor_name},

I am writing to confirm that I have submitted my assignment "{assignment.get('title', 'Assignment')}" for {assignment.get('course_code', 'the course')}.

Please let me know if you have any questions.

Best regards,
{student_name}"""
        }


async def generate_template_with_ai(
    assignment: Dict[str, Any],
    template_type: str = "word",
    rubric: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Generate an AI-enhanced template for an assignment.
    
    Args:
        assignment: Assignment details
        template_type: 'word' or 'ppt'
        rubric: Optional rubric for structured sections
    
    Returns:
        Template structure with sections
    """
    
    rubric_text = ""
    if rubric:
        rubric_text = "\n".join([
            f"- {r.get('criteria', 'Section')}: {r.get('points', 0)} points"
            for r in rubric
        ])
    
    system_prompt = """You are an academic template generator. Create structured templates for assignments.

Return a JSON object:
{
    "title": "assignment title",
    "sections": [
        {
            "name": "section name",
            "description": "what should go in this section",
            "placeholder": "placeholder text for the section",
            "points": number (if rubric-based)
        }
    ],
    "guidelines": ["list of submission guidelines"],
    "checklist": ["items to verify before submission"]
}"""

    user_prompt = f"""Create a {template_type} template for this assignment:

ASSIGNMENT:
- Title: {assignment.get('title', 'Assignment')}
- Course: {assignment.get('course_code', 'Course')}
- Description: {assignment.get('description', 'Complete the assignment')}

{f"RUBRIC:{chr(10)}{rubric_text}" if rubric_text else ""}

Generate a comprehensive template structure."""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "LearnLens Template Generator"
                },
                json={
                    "model": "openai/gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.4,
                    "response_format": {"type": "json_object"}
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "{}")
                return json.loads(content)
            else:
                return _fallback_template(assignment, template_type)
    except Exception as e:
        return _fallback_template(assignment, template_type)


def _fallback_template(assignment: Dict[str, Any], template_type: str) -> Dict[str, Any]:
    """Fallback template when AI generation fails."""
    return {
        "title": assignment.get("title", "Assignment"),
        "sections": [
            {
                "name": "Introduction",
                "description": "Introduce your topic and thesis",
                "placeholder": "[Write your introduction here]"
            },
            {
                "name": "Main Content",
                "description": "Present your main arguments or work",
                "placeholder": "[Add your main content here]"
            },
            {
                "name": "Conclusion",
                "description": "Summarize your findings",
                "placeholder": "[Write your conclusion here]"
            },
            {
                "name": "References",
                "description": "List your sources",
                "placeholder": "[Add references here]"
            }
        ],
        "guidelines": [
            "Follow the assignment rubric",
            "Cite all sources properly",
            "Proofread before submission"
        ],
        "checklist": [
            "All sections completed",
            "Word count requirement met",
            "Proper formatting applied",
            "File named correctly"
        ]
    }
