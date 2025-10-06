"""
Reset password for an existing user
"""
from pymongo import MongoClient
import bcrypt

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["gov_portal"]
users_collection = db["users"]

# Choose which user to reset
email = "anirudh200503@gmail.com"  # Change this to the email you want
new_password = "Test@123"           # New password

# Hash the new password
hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())

# Update the user
result = users_collection.update_one(
    {"email": email},
    {"$set": {"password": hashed_password.decode('utf-8')}}
)

if result.modified_count > 0:
    print("=" * 60)
    print(f"✅ Password reset successful!")
    print("=" * 60)
    print(f"\nYou can now login with:")
    print(f"   Email: {email}")
    print(f"   Password: {new_password}")
    print(f"\nLogin at: http://localhost:5173/login")
    print("=" * 60)
else:
    user = users_collection.find_one({"email": email})
    if user:
        print(f"⚠️  Password might already be set to {new_password}")
        print(f"\nTry logging in with:")
        print(f"   Email: {email}")
        print(f"   Password: {new_password}")
    else:
        print(f"❌ User {email} not found")
