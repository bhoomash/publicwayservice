"""
Test script for RAG endpoints
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/rag"

def test_health():
    """Test RAG health endpoint"""
    print("Testing RAG health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_analyze_text():
    """Test text analysis endpoint (public)"""
    print("\n\nTesting public text analysis endpoint...")
    data = {
        "text": "There is a broken water pipe on Main Street causing flooding. The road is damaged and needs urgent repair.",
        "max_results": 3
    }
    try:
        response = requests.post(f"{BASE_URL}/public/analyze-text", json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_add_to_vector_db():
    """Test adding complaint to vector database (public)"""
    print("\n\nTesting add to vector database (public)...")
    data = {
        "id": "TEST001",
        "title": "Broken Street Light",
        "description": "The street light on Park Avenue has been broken for 2 weeks, causing safety issues at night",
        "category": "Infrastructure",
        "location": "Park Avenue, Downtown",
        "status": "pending"
    }
    try:
        response = requests.post(f"{BASE_URL}/public/add-to-vector-db", json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_search_after_add():
    """Test searching for the complaint we just added"""
    print("\n\nTesting search for added complaint (public)...")
    data = {
        "text": "street light not working at night safety issue",
        "max_results": 3
    }
    try:
        response = requests.post(f"{BASE_URL}/public/analyze-text", json=data)
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        # Check if we found the complaint we added
        if result.get('similar_complaints'):
            print(f"\n✅ Found {len(result['similar_complaints'])} similar complaints")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("RAG Public Endpoints Test Suite")
    print("=" * 60)
    
    results = {
        "health": test_health(),
        "add_to_vector_db": test_add_to_vector_db(),
        "analyze_text": test_analyze_text(),
        "search_after_add": test_search_after_add()
    }
    
    print("\n\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    all_passed = all(results.values())
    print("\n" + ("=" * 60))
    if all_passed:
        print("🎉 All tests passed!")
    else:
        print("⚠️  Some tests failed. Check the output above.")
    print("=" * 60)
