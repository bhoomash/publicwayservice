"""
Verify test user email with OTP
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def verify_user():
    """Verify test user email"""
    email = "test@example.com"
    
    print(f"Verifying email for: {email}")
    print("\nCheck the backend terminal logs for the OTP code")
    print("It should look like: 'OTP for test@example.com: 123456'\n")
    
    otp = input("Enter the OTP code from backend logs: ").strip()
    
    if not otp or len(otp) != 6:
        print("❌ Invalid OTP format. Should be 6 digits.")
        return False
    
    try:
        data = {
            "email": email,
            "otp_code": otp
        }
        
        response = requests.post(f"{BASE_URL}/auth/verify-email", json=data)
        
        if response.status_code == 200:
            print("\n✅ Email verified successfully!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            print("\nYou can now login at: http://localhost:5173/login")
            print(f"Email: {email}")
            print("Password: Test@123")
            return True
        else:
            print(f"\n❌ Verification failed!")
            print(f"Status: {response.status_code}")
            print(f"Detail: {response.json().get('detail')}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Email Verification Script")
    print("=" * 60)
    print()
    
    verify_user()
    
    print("\n" + "=" * 60)
