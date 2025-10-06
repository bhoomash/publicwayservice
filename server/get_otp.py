"""
Get OTP from MongoDB for test user
"""
from pymongo import MongoClient
import json

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["government_portal"]
otps_collection = db["otps"]

# Find OTP for test user
email = "test@example.com"
otp_doc = otps_collection.find_one({"email": email})

if otp_doc:
    print("=" * 60)
    print(f"OTP for {email}:")
    print("=" * 60)
    print(f"\n   CODE: {otp_doc['otp_code']}\n")
    print(f"   Created: {otp_doc['created_at']}")
    print(f"   Purpose: {otp_doc.get('purpose', 'email_verification')}")
    print("\n" + "=" * 60)
    print("\nRun this to verify:")
    print(f"python verify_test_user.py")
    print("\nOr manually verify with:")
    print(f'curl -X POST http://localhost:8000/auth/verify-email -H "Content-Type: application/json" -d \'{{"email": "{email}", "otp_code": "{otp_doc["otp_code"]}"}}\'')
    print("=" * 60)
else:
    print(f"❌ No OTP found for {email}")
    print("Try registering the user again.")
