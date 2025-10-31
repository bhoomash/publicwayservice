"""Test the chatbot API with Gemini integration"""
import requests
import json

API_URL = "http://127.0.0.1:8000"

def test_chat_without_auth():
    """Test chat endpoint without authentication (should fail gracefully)"""
    print("\n" + "="*80)
    print("TEST 1: Chat without authentication")
    print("="*80)
    
    response = requests.post(
        f"{API_URL}/chat/message",
        json={"message": "Hello, how can I submit a complaint?"}
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:200]}")
    

def test_chat_with_auth():
    """Test chat endpoint with authentication"""
    print("\n" + "="*80)
    print("TEST 2: Chat with authentication")
    print("="*80)
    
    # First login
    login_response = requests.post(
        f"{API_URL}/auth/login-json",
        json={
            "email": "anirudh200503@gmail.com",
            "password": "Anirudh123@"
        }
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return
    
    token = login_response.json().get("access_token")
    print(f"✅ Login successful, got token")
    
    # Test different chat messages
    test_messages = [
        "Hello, I need help with a complaint",
        "How do I track my complaint status?",
        "There is a broken streetlight on my street",
        "What is the average resolution time?",
    ]
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n--- Chat Message {i} ---")
        print(f"User: {message}")
        
        response = requests.post(
            f"{API_URL}/chat/message",
            json={"message": message},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Status: {response.status_code}")
            print(f"Bot: {data.get('ai_response', 'No response')[:200]}...")
        else:
            print(f"❌ Status: {response.status_code}")
            print(f"Error: {response.text[:200]}")


def test_gemini_direct():
    """Test Gemini API directly"""
    print("\n" + "="*80)
    print("TEST 3: Direct Gemini API test")
    print("="*80)
    
    import os
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ GEMINI_API_KEY not found in .env")
        return
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"
    
    data = {
        "contents": [{
            "parts": [{"text": "Hello! Say 'Gemini AI is working!' if you can read this."}]
        }]
    }
    
    response = requests.post(url, json=data, timeout=10)
    
    if response.status_code == 200:
        result = response.json()
        if 'candidates' in result:
            text = result['candidates'][0]['content']['parts'][0]['text']
            print(f"✅ Gemini API is working!")
            print(f"Response: {text}")
        else:
            print(f"❌ Unexpected response format: {result}")
    else:
        print(f"❌ Gemini API failed: {response.status_code}")
        print(f"Error: {response.text}")


if __name__ == "__main__":
    print("\n🤖 CHATBOT API TESTS")
    print("Make sure the server is running on http://127.0.0.1:8000\n")
    
    # Test 1: No auth
    test_chat_without_auth()
    
    # Test 2: With auth
    test_chat_with_auth()
    
    # Test 3: Direct Gemini
    test_gemini_direct()
    
    print("\n" + "="*80)
    print("✅ TESTS COMPLETE")
    print("="*80)
