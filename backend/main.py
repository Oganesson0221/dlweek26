import argparse
from pathlib import Path
from PIL import Image
import requests
from io import BytesIO

from config import Config
from agent import AIAgent, MultiAgentSystem
from vision import VisionProcessor, VideoFrameAnalyzer

def create_sample_image():
    """Create a sample image for testing"""
    img = Image.new('RGB', (400, 300), color='lightblue')
    from PIL import ImageDraw, ImageFont
    
    draw = ImageDraw.Draw(img)
    draw.rectangle([100, 100, 300, 200], outline='red', width=3)
    draw.text((150, 140), "DLW 2026", fill='black')
    
    sample_path = Config.IMAGE_DIR / 'sample.jpg'
    img.save(sample_path)
    return sample_path

def setup_demo_agents():
    """Create demo agents for testing"""
    # Create specialized agents
    researcher = AIAgent("Researcher", 
                        "You are a research assistant who finds and summarizes information.")
    
    coder = AIAgent("Coder", 
                   "You are a programming expert who writes and explains code.")
    
    critic = AIAgent("Critic", 
                    "You are a critical thinker who evaluates ideas and finds flaws.")
    
    # Add a simple tool
    def calculate(expression):
        try:
            return str(eval(expression))
        except:
            return "Invalid expression"
    
    researcher.add_tool("calculator", calculate, "Evaluate mathematical expressions")
    
    # Create multi-agent system
    mas = MultiAgentSystem()
    mas.add_agent(researcher)
    mas.add_agent(coder)
    mas.add_agent(critic)
    
    return mas

def main():
    parser = argparse.ArgumentParser(description='DLW AI Starter Kit')
    parser.add_argument('--mode', choices=['agent', 'vision', 'both'], 
                       default='both', help='Run mode')
    parser.add_argument('--task', type=str, help='Task description for agent')
    parser.add_argument('--image', type=str, help='Path to image file')
    args = parser.parse_args()
    
    # Validate configuration
    try:
        Config.validate()
        print("✅ Configuration validated\n")
    except ValueError as e:
        print(f"❌ {e}")
        print("\nPlease add your API key to the .env file")
        return
    
    # Initialize OpenAI client
    print("🚀 DLW AI Starter Kit")
    print("=" * 50)
    
    if args.mode in ['agent', 'both']:
        print("\n🤖 Testing Agentic AI")
        print("-" * 30)
        
        # Setup agents
        mas = setup_demo_agents()
        
        # Test tasks
        tasks = [
            args.task if args.task else "Explain what an AI agent is in 2 sentences",
            "What's 15 * 7 + 3?"  # Test tool usage
        ]
        
        for task in tasks:
            print(f"\n📝 Task: {task}")
            
            # Try with researcher agent
            result = mas.delegate_task(task, "Researcher")
            print(f"🤔 Response: {result['response'][:150]}...")
            
            if result.get('collaboration') != 'none':
                print("🔄 Collaboration detected!")
    
    if args.mode in ['vision', 'both']:
        print("\n👁️ Testing Computer Vision")
        print("-" * 30)
        
        vision = VisionProcessor()
        
        # Get image to analyze
        image_path = None
        if args.image:
            image_path = Path(args.image)
        else:
            # Try to download a test image or create one
            try:
                print("📸 Downloading sample image...")
                response = requests.get("https://picsum.photos/400/300")
                img = Image.open(BytesIO(response.content))
                image_path = Config.IMAGE_DIR / 'downloaded.jpg'
                img.save(image_path)
                print(f"✅ Downloaded sample image")
            except:
                print("🎨 Creating sample image...")
                image_path = create_sample_image()
                print(f"✅ Created sample image")
        
        if image_path and image_path.exists():
            print(f"\n📷 Analyzing image: {image_path}")
            
            # Test different vision capabilities
            print("\n1. Scene Description:")
            desc = vision.describe_scene(image_path)
            print(f"   {desc[:200]}...")
            
            print("\n2. Object Detection:")
            objects = vision.detect_objects(image_path)
            print(f"   Objects: {', '.join(objects[:5])}")
            
            print("\n3. Text Extraction:")
            text = vision.extract_text(image_path)
            print(f"   Text found: {text}")
            
            # Test video analysis if we had a video
            print("\n4. Video Analysis (simulated):")
            video_analyzer = VideoFrameAnalyzer(vision)
            video_result = video_analyzer.analyze_video("sample_video.mp4")
            print(f"   {video_result['summary']}")
    
    print("\n" + "=" * 50)
    print("✅ Setup complete! Your OpenAI API key is working.")
    print("\nNext steps:")
    print("1. Modify the agents in agent.py for your needs")
    print("2. Add your own images to the 'images' folder")
    print("3. Run specific tasks:")
    print("   python main.py --mode agent --task 'your task here'")
    print("   python main.py --mode vision --image path/to/image.jpg")

if __name__ == "__main__":
    main()