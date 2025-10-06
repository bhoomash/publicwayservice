"""
Quick script to create a test user for login testing
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def create_test_user():
    """Create a test user with verified email"""
    print("Creating test user...")
    
    # User data
    user_data = {
        "email": "test@example.com",
        "password": "Test@123",
        "first_name": "Test",
        "last_name": "User",
        "phone": "1234567890",
        "role": "citizen"
    }
    
    try:
        # Register user
        print(f"\n1. Registering user: {user_data['email']}")
        response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 201:
            print("\n✅ User registered successfully!")
            print("\n⚠️  Important: You need to verify the email with OTP")
            print(f"   Check the console logs in the backend terminal for the OTP code")
            print(f"   Then run: python verify_test_user.py")
            return True
        elif response.status_code == 400 and "already registered" in response.json().get('detail', ''):
            print("\n✅ User already exists!")
            print("   You can try logging in directly")
            return True
        else:
            print(f"\n❌ Registration failed: {response.json().get('detail')}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Cannot connect to backend server")
        print("   Make sure the server is running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False

def test_login():
    """Test login with the created user"""
    print("\n\n2. Testing login...")
    
    login_data = {
        "email": "test@example.com",
        "password": "Test@123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login-json", json=login_data)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Login successful!")
            print(f"   Token: {data['access_token'][:50]}...")
            return True
        elif response.status_code == 403:
            print(f"\n⚠️  Email not verified!")
            print(f"   Detail: {response.json().get('detail')}")
            print(f"\n   Next steps:")
            print(f"   1. Check backend logs for OTP code")
            print(f"   2. Run: python verify_test_user.py")
            return False
        else:
            print(f"\n❌ Login failed!")
            print(f"   Detail: {response.json().get('detail')}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Test User Creation Script")
    print("=" * 60)
    
    if create_test_user():
        test_login()
    
    print("\n" + "=" * 60)
    print("\nNext Steps:")
    print("1. If email verification is needed, check backend logs for OTP")
    print("2. Run: python verify_test_user.py")
    print("3. Then try logging in at: http://localhost:5173/login")
    print("   Email: test@example.com")
    print("   Password: Test@123")
    print("=" * 60)
