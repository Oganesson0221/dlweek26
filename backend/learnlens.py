from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List

# Import our services
from services.ai_service import generate_quiz_from_slides, contextual_chat_response
from services.doc_service import generate_assignment_template

app = FastAPI(title="LearnLens API")

# --- Pydantic Schemas for Frontend Communication ---
class ChatRequest(BaseModel):
    message: str
    current_route: str
    user_id: int

class ChatResponse(BaseModel):
    reply: str

class AnalyticsOverview(BaseModel):
    current_gpa: float
    study_hours_this_week: int
    completed_tasks: int

# --- Routes ---

@app.get("/api/v1/analytics/overview", response_model=AnalyticsOverview)
async def get_analytics_overview():
    """Powers the OverviewPage.tsx and TrackingPage.tsx"""
    # In reality, query the database here
    return {
        "current_gpa": 3.8,
        "study_hours_this_week": 14,
        "completed_tasks": 5
    }

@app.post("/api/v1/courses/upload-slides")
async def upload_course_slides(file: UploadFile = File(...)):
    """Powers the Quiz panel and Course panel slide processing"""
    # 1. Read file
    content = await file.read()
    
    # 2. Extract text (mocked here, would use OCR/Vision API for images/PDFs)
    extracted_text = "Sample extracted lecture text..."
    
    # 3. Generate Quiz
    quiz_data = await generate_quiz_from_slides(extracted_text)
    
    return {"status": "success", "quiz": quiz_data}

@app.get("/api/v1/submissions/{assignment_id}/template")
async def download_template(assignment_id: int):
    """Powers the automatic Word doc setup in the Submissions panel"""
    # Fetch assignment details from DB based on ID
    course_code = "CS101"
    title = "Machine Learning Basics"
    
    file_stream = generate_assignment_template(course_code, title, "John Doe")
    
    return StreamingResponse(
        file_stream, 
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={title.replace(' ', '_')}.docx"}
    )

@app.post("/api/v1/chat", response_model=ChatResponse)
async def handle_chatbot(request: ChatRequest):
    """Powers the Global Chatbot Bar"""
    # Fetch user data/analytics from DB to pass to AI context
    mock_user_data = {"avg_score": 75.0, "weak_topics": ["Neural Networks"]}
    
    reply = await contextual_chat_response(
        message=request.message,
        current_route=request.current_route,
        user_data=mock_user_data
    )
    
    return {"reply": reply}

if __name__ == "__learnlens__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)