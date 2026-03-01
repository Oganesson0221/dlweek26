# import argparse
# from pathlib import Path
# from PIL import Image
# import requests
# from io import BytesIO

# from config import Config
# from agent import AIAgent, MultiAgentSystem
# from vision import VisionProcessor, VideoFrameAnalyzer

# def create_sample_image():
#     """Create a sample image for testing"""
#     img = Image.new('RGB', (400, 300), color='lightblue')
#     from PIL import ImageDraw, ImageFont
    
#     draw = ImageDraw.Draw(img)
#     draw.rectangle([100, 100, 300, 200], outline='red', width=3)
#     draw.text((150, 140), "DLW 2026", fill='black')
    
#     sample_path = Config.IMAGE_DIR / 'sample.jpg'
#     img.save(sample_path)
#     return sample_path

# def setup_demo_agents():
#     """Create demo agents for testing"""
#     # Create specialized agents
#     researcher = AIAgent("Researcher", 
#                         "You are a research assistant who finds and summarizes information.")
    
#     coder = AIAgent("Coder", 
#                    "You are a programming expert who writes and explains code.")
    
#     critic = AIAgent("Critic", 
#                     "You are a critical thinker who evaluates ideas and finds flaws.")
    
#     # Add a simple tool
#     def calculate(expression):
#         try:
#             return str(eval(expression))
#         except:
#             return "Invalid expression"
    
#     researcher.add_tool("calculator", calculate, "Evaluate mathematical expressions")
    
#     # Create multi-agent system
#     mas = MultiAgentSystem()
#     mas.add_agent(researcher)
#     mas.add_agent(coder)
#     mas.add_agent(critic)
    
#     return mas

# def main():
#     parser = argparse.ArgumentParser(description='DLW AI Starter Kit')
#     parser.add_argument('--mode', choices=['agent', 'vision', 'both'], 
#                        default='both', help='Run mode')
#     parser.add_argument('--task', type=str, help='Task description for agent')
#     parser.add_argument('--image', type=str, help='Path to image file')
#     args = parser.parse_args()
    
#     # Validate configuration
#     try:
#         Config.validate()
#         print("✅ Configuration validated\n")
#     except ValueError as e:
#         print(f"❌ {e}")
#         print("\nPlease add your API key to the .env file")
#         return
    
#     # Initialize OpenAI client
#     print("🚀 DLW AI Starter Kit")
#     print("=" * 50)
    
#     if args.mode in ['agent', 'both']:
#         print("\n🤖 Testing Agentic AI")
#         print("-" * 30)
        
#         # Setup agents
#         mas = setup_demo_agents()
        
#         # Test tasks
#         tasks = [
#             args.task if args.task else "Explain what an AI agent is in 2 sentences",
#             "What's 15 * 7 + 3?"  # Test tool usage
#         ]
        
#         for task in tasks:
#             print(f"\n📝 Task: {task}")
            
#             # Try with researcher agent
#             result = mas.delegate_task(task, "Researcher")
#             print(f"🤔 Response: {result['response'][:150]}...")
            
#             if result.get('collaboration') != 'none':
#                 print("🔄 Collaboration detected!")
    
#     if args.mode in ['vision', 'both']:
#         print("\n👁️ Testing Computer Vision")
#         print("-" * 30)
        
#         vision = VisionProcessor()
        
#         # Get image to analyze
#         image_path = None
#         if args.image:
#             image_path = Path(args.image)
#         else:
#             # Try to download a test image or create one
#             try:
#                 print("📸 Downloading sample image...")
#                 response = requests.get("https://picsum.photos/400/300")
#                 img = Image.open(BytesIO(response.content))
#                 image_path = Config.IMAGE_DIR / 'downloaded.jpg'
#                 img.save(image_path)
#                 print(f"✅ Downloaded sample image")
#             except:
#                 print("🎨 Creating sample image...")
#                 image_path = create_sample_image()
#                 print(f"✅ Created sample image")
        
#         if image_path and image_path.exists():
#             print(f"\n📷 Analyzing image: {image_path}")
            
#             # Test different vision capabilities
#             print("\n1. Scene Description:")
#             desc = vision.describe_scene(image_path)
#             print(f"   {desc[:200]}...")
            
#             print("\n2. Object Detection:")
#             objects = vision.detect_objects(image_path)
#             print(f"   Objects: {', '.join(objects[:5])}")
            
#             print("\n3. Text Extraction:")
#             text = vision.extract_text(image_path)
#             print(f"   Text found: {text}")
            
#             # Test video analysis if we had a video
#             print("\n4. Video Analysis (simulated):")
#             video_analyzer = VideoFrameAnalyzer(vision)
#             video_result = video_analyzer.analyze_video("sample_video.mp4")
#             print(f"   {video_result['summary']}")
    
#     print("\n" + "=" * 50)
#     print("✅ Setup complete! Your OpenAI API key is working.")
#     print("\nNext steps:")
#     print("1. Modify the agents in agent.py for your needs")
#     print("2. Add your own images to the 'images' folder")
#     print("3. Run specific tasks:")
#     print("   python main.py --mode agent --task 'your task here'")
#     print("   python main.py --mode vision --image path/to/image.jpg")

# if __name__ == "__main__":
#     main()

from fastapi import FastAPI, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from .db import init_db, get_session
from .models import Course, Checkpoint, StudyEvent, QuizAttempt, Submission, UploadDoc
from .schemas import (
    CourseCreate, CheckpointCreate, StudyEventCreate, QuizAttemptCreate,
    SubmissionCreate, AgentMessage
)
from .services.analytics import mastery_by_topic, improvement_trend
from .services.planner import compute_study_plan
from .agent import handle_agent_message
from .vision import save_image, analyze_image_mock

from pathlib import Path
from datetime import datetime

UPLOADS_DIR = Path("./uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Study Navigator Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

@app.get("/health")
def health():
    return {"ok": True}

# Courses
@app.post("/courses")
def create_course(body: CourseCreate, session: Session = Depends(get_session)):
    c = Course(name=body.name, term=body.term)
    session.add(c)
    session.commit()
    session.refresh(c)
    return c

@app.get("/courses")
def list_courses(session: Session = Depends(get_session)):
    return session.exec(select(Course)).all()

# Checkpoints
@app.post("/courses/{course_id}/checkpoints")
def add_checkpoint(course_id: int, body: CheckpointCreate, session: Session = Depends(get_session)):
    cp = Checkpoint(course_id=course_id, title=body.title, kind=body.kind, due_at=body.due_at, weight=body.weight)
    session.add(cp)
    session.commit()
    session.refresh(cp)
    return cp

@app.get("/courses/{course_id}/checkpoints")
def list_checkpoints(course_id: int, session: Session = Depends(get_session)):
    return session.exec(select(Checkpoint).where(Checkpoint.course_id == course_id)).all()

# Study + attempts
@app.post("/courses/{course_id}/study")
def add_study(course_id: int, body: StudyEventCreate, session: Session = Depends(get_session)):
    ev = StudyEvent(course_id=course_id, topic=body.topic, minutes=body.minutes)
    session.add(ev)
    session.commit()
    session.refresh(ev)
    return ev

@app.post("/courses/{course_id}/attempts")
def add_attempt(course_id: int, body: QuizAttemptCreate, session: Session = Depends(get_session)):
    at = QuizAttempt(course_id=course_id, topic=body.topic, correct=body.correct, total=body.total, time_taken_sec=body.time_taken_sec)
    session.add(at)
    session.commit()
    session.refresh(at)
    return at

@app.get("/courses/{course_id}/mastery")
def get_mastery(course_id: int, session: Session = Depends(get_session)):
    return mastery_by_topic(session, course_id)

@app.get("/courses/{course_id}/trend")
def get_trend(course_id: int, topic: str | None = None, session: Session = Depends(get_session)):
    return improvement_trend(session, course_id, topic)

# Planner (maps route)
@app.get("/courses/{course_id}/plan")
def get_plan(course_id: int, minutes: int = 120, session: Session = Depends(get_session)):
    return compute_study_plan(session, course_id, minutes)

# Submissions
@app.post("/courses/{course_id}/submissions")
def add_submission(course_id: int, body: SubmissionCreate, session: Session = Depends(get_session)):
    s = Submission(course_id=course_id, title=body.title, due_at=body.due_at)
    session.add(s)
    session.commit()
    session.refresh(s)
    return s

@app.get("/courses/{course_id}/submissions")
def list_submissions(course_id: int, session: Session = Depends(get_session)):
    return session.exec(select(Submission).where(Submission.course_id == course_id)).all()

# Upload docs (slides/notes)
@app.post("/courses/{course_id}/upload")
def upload_doc(
    course_id: int,
    doc_type: str = Form("slides"),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    stored = UPLOADS_DIR / f"{course_id}_{int(datetime.utcnow().timestamp())}_{file.filename}"
    with stored.open("wb") as f:
        f.write(file.file.read())

    doc = UploadDoc(course_id=course_id, filename=file.filename, doc_type=doc_type, stored_path=str(stored))
    session.add(doc)
    session.commit()
    session.refresh(doc)
    return doc

# Agent (Copilot companion)
@app.post("/agent/chat")
def agent_chat(body: AgentMessage, session: Session = Depends(get_session)):
    return handle_agent_message(session, body.course_id, body.page, body.message)

# Vision upload + analysis (mock)
@app.post("/vision/analyze")
def vision_analyze(file: UploadFile = File(...)):
    path = save_image(file)
    return analyze_image_mock(path)