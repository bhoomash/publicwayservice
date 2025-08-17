"""
Script to create an admin user in the database
"""
import asyncio
from pymongo import MongoClient
from datetime import datetime
import bcrypt

# Database connection
client = MongoClient("mongodb://localhost:27017/")
db = client["grievancebot"]
users_collection = db["users"]

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_admin_user():
    """Create an admin user"""
    email = "anirudh200503@gmail.com"
    password = "Anirudh123@"
    
    # Check if admin already exists
    existing_admin = users_collection.find_one({"email": email})
    if existing_admin:
        # Update existing user to be admin
        users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "is_admin": True,
                    "is_verified": True,
                    "hashed_password": hash_password(password),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        print(f"Updated existing user {email} to admin with new password")
    else:
        # Create new admin user
        admin_user = {
            "email": email,
            "hashed_password": hash_password(password),
            "first_name": "Admin",
            "last_name": "User",
            "is_verified": True,
            "is_admin": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "profile": {
                "phone": "",
                "address": "",
                "bio": "System Administrator"
            },
            "notification_settings": {
                "email_notifications": True,
                "sms_notifications": False,
                "push_notifications": True
            },
            "privacy_settings": {
                "profile_visibility": "public",
                "show_email": False,
                "show_phone": False
            }
        }
        
        result = users_collection.insert_one(admin_user)
        print(f"Created new admin user {email} with ID: {result.inserted_id}")
    
    print("\nAdmin credentials:")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print("User is verified and has admin privileges")

if __name__ == "__main__":
    create_admin_user()
