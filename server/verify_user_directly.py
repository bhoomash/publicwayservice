"""
Directly verify test user in MongoDB (bypass OTP)
"""
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["government_portal"]
users_collection = db["users"]

# Update test user to verified
email = "test@example.com"
result = users_collection.update_one(
    {"email": email},
    {"$set": {"is_verified": True}}
)

if result.modified_count > 0:
    print("=" * 60)
    print(f"✅ User {email} has been verified!")
    print("=" * 60)
    print("\nYou can now login with:")
    print(f"   Email: {email}")
    print(f"   Password: Test@123")
    print("\nLogin at: http://localhost:5173/login")
    print("=" * 60)
else:
    user = users_collection.find_one({"email": email})
    if user:
        if user.get("is_verified"):
            print(f"✅ User {email} is already verified!")
            print("\nYou can login with:")
            print(f"   Email: {email}")
            print(f"   Password: Test@123")
        else:
            print(f"❌ Failed to update user {email}")
    else:
        print(f"❌ User {email} not found in database")
