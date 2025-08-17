import bcrypt
from app.db import get_database

def verify_and_create_admin():
    """Verify if admin exists, if not create one"""
    db = get_database()
    users_collection = db.users
    
    admin_email = "anirudh200503@gmail.com"
    admin_password = "Anirudh123@"
    
    # Check if admin already exists
    existing_admin = users_collection.find_one({"email": admin_email})
    
    if existing_admin:
        print(f"Admin user already exists: {admin_email}")
        print(f"Is admin: {existing_admin.get('is_admin', False)}")
        print(f"Is verified: {existing_admin.get('is_verified', False)}")
        
        # Update to ensure it's admin and verified
        users_collection.update_one(
            {"email": admin_email},
            {"$set": {"is_admin": True, "is_verified": True}}
        )
        print("Updated admin status and verification")
    else:
        # Hash the password
        hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt())
        
        # Create admin user
        admin_user = {
            "email": admin_email,
            "password": hashed_password.decode('utf-8'),
            "name": "Admin",
            "phone": "+1234567890",
            "is_admin": True,
            "is_verified": True,
            "bio": "System Administrator"
        }
        
        result = users_collection.insert_one(admin_user)
        print(f"Admin user created successfully with ID: {result.inserted_id}")
    
    print(f"Admin login credentials:")
    print(f"Email: {admin_email}")
    print(f"Password: {admin_password}")

if __name__ == "__main__":
    verify_and_create_admin()
