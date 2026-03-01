# import base64
# import requests
# from pathlib import Path
# from PIL import Image
# import io
# import openai
# from config import Config

# class VisionProcessor:
#     """Handle computer vision tasks using GPT-4 Vision"""
    
#     def __init__(self):
#         self.client = openai.OpenAI(
#             api_key=Config.OPENAI_API_KEY,
#             organization=Config.OPENAI_ORG_ID
#         )
    
#     def encode_image(self, image_input):
#         """Encode image to base64"""
#         if isinstance(image_input, (str, Path)):
#             with open(image_input, "rb") as image_file:
#                 return base64.b64encode(image_file.read()).decode('utf-8')
#         elif isinstance(image_input, Image.Image):
#             buffered = io.BytesIO()
#             image_input.save(buffered, format="PNG")
#             return base64.b64encode(buffered.getvalue()).decode('utf-8')
#         else:
#             raise ValueError("Unsupported image input type")
    
#     def analyze_image(self, image_input, prompt: str = "What's in this image?"):
#         """Analyze an image with a prompt"""
#         try:
#             base64_image = self.encode_image(image_input)
            
#             response = self.client.chat.completions.create(
#                 model=Config.VISION_MODEL,
#                 messages=[
#                     {
#                         "role": "user",
#                         "content": [
#                             {"type": "text", "text": prompt},
#                             {
#                                 "type": "image_url",
#                                 "image_url": {
#                                     "url": f"data:image/jpeg;base64,{base64_image}"
#                                 }
#                             }
#                         ]
#                     }
#                 ],
#                 max_tokens=Config.MAX_TOKENS
#             )
            
#             return response.choices[0].message.content
#         except Exception as e:
#             return f"Error analyzing image: {e}"
    
#     def detect_objects(self, image_input):
#         """Detect objects in an image"""
#         prompt = """List all objects you can see in this image. 
#         Format as a comma-separated list. Be specific."""
#         result = self.analyze_image(image_input, prompt)
        
#         # Parse the response into a list
#         objects = [obj.strip() for obj in result.split(',')]
#         return objects
    
#     def extract_text(self, image_input):
#         """Extract text from image (OCR-like)"""
#         prompt = """Extract and return any text visible in this image. 
#         If no text is visible, say 'No text detected'."""
#         return self.analyze_image(image_input, prompt)
    
#     def describe_scene(self, image_input):
#         """Get a detailed scene description"""
#         prompt = """Describe this image in detail. Include:
#         - Main subjects/objects
#         - Colors and lighting
#         - Setting/background
#         - Actions or interactions
#         - Mood or atmosphere"""
#         return self.analyze_image(image_input, prompt)
    
#     def compare_images(self, image1, image2):
#         """Compare two images"""
#         desc1 = self.describe_scene(image1)
#         desc2 = self.describe_scene(image2)
        
#         comparison_prompt = f"""Compare these two image descriptions:

# Image 1: {desc1}

# Image 2: {desc2}

# What are the key similarities and differences?"""
        
#         return self.analyze_image(image1, comparison_prompt)

# class VideoFrameAnalyzer:
#     """Analyze video frames (simplified)"""
    
#     def __init__(self, vision_processor):
#         self.vision = vision_processor
#         self.frames = []
    
#     def extract_key_frames(self, video_path, num_frames=5):
#         """Simulate frame extraction from video"""
#         # In reality, you'd use OpenCV or similar
#         # This is a placeholder that creates dummy frames
#         print(f"🎥 Would extract {num_frames} frames from {video_path}")
#         return [f"frame_{i}.jpg" for i in range(num_frames)]
    
#     def analyze_video(self, video_path):
#         """Analyze video by sampling frames"""
#         frames = self.extract_key_frames(video_path)
#         analyses = []
        
#         for i, frame in enumerate(frames):
#             # Simulate frame analysis
#             analysis = self.vision.describe_scene(Config.IMAGE_DIR / 'sample.jpg' 
#                                                    if (Config.IMAGE_DIR / 'sample.jpg').exists() 
#                                                    else None)
#             analyses.append(f"Frame {i+1}: {analysis}")
        
#         return {
#             "summary": f"Analyzed {len(frames)} key frames",
#             "frame_analyses": analyses
#         }

from pathlib import Path
from datetime import datetime
from fastapi import UploadFile

IMAGES_DIR = Path("./images")
IMAGES_DIR.mkdir(exist_ok=True)

def save_image(file: UploadFile) -> str:
    name = f"{int(datetime.utcnow().timestamp())}_{file.filename}"
    path = IMAGES_DIR / name
    with path.open("wb") as f:
        f.write(file.file.read())
    return str(path)

def analyze_image_mock(stored_path: str) -> dict:
    return {
        "stored_path": stored_path,
        "insight": "Mock vision analysis. Plug in Azure Vision later.",
        "tags": ["lecture", "notes", "diagram"]
    }