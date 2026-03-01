import openai
from config import Config

# Initialize OpenAI client
client = openai.OpenAI(
    api_key=Config.OPENAI_API_KEY,
    organization=Config.OPENAI_ORG_ID
)

def test_connection():
    """Test if OpenAI connection is working"""
    try:
        # Simple test to check connection
        models = client.models.list()
        print("✅ Successfully connected to OpenAI!")
        print(f"Available models: {len(models.data)} models found")
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def get_chat_response(prompt="Hello, how are you?"):
    """Get a response from ChatGPT"""
    try:
        response = client.chat.completions.create(
            model=Config.MODEL_NAME,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=Config.MAX_TOKENS,
            temperature=Config.TEMPERATURE
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error: {e}"

def main():
    print("🚀 OpenAI Credits Setup Test\n" + "="*30)
    
    # Validate configuration
    try:
        Config.validate()
        print("✅ Configuration validated")
    except ValueError as e:
        print(f"❌ {e}")
        print("\nPlease add your API key to the .env file")
        return
    
    # Test connection
    if not test_connection():
        print("\n❌ Please check your API key and organization ID")
        return
    
    # Demo chat
    print("\n" + "="*30)
    print("💬 Chat Demo (using placeholder prompt)")
    print("="*30)
    
    # Placeholder prompt
    prompt = "What is the capital of France? (keep it brief)"
    print(f"📝 Prompt: {prompt}")
    
    response = get_chat_response(prompt)
    print(f"🤖 Response: {response}")
    
    print("\n✅ Setup complete! Your OpenAI API key is working.")
    print("You can now modify main.py to add your own prompts.")

if __name__ == "__main__":
    main()