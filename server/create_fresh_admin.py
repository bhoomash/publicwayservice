import bcrypt
from app.db import get_database

def check_and_reset_admin():
    """Check admin user and reset password if needed"""
    db = get_database()
    users_collection = db.users
    
    admin_email = "admin@gov-portal.com"
    admin_password = "admin123"
    
    # Delete existing admin if any
    users_collection.delete_many({"email": admin_email})
    users_collection.delete_many({"email": "anirudh200503@gmail.com"})
    
    # Hash the password
    hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt())
    
    # Create fresh admin user
    admin_user = {
        "email": admin_email,
        "password": hashed_password.decode('utf-8'),
        "first_name": "Admin",
        "last_name": "User",
        "phone": "+1234567890",
        "is_admin": True,
        "is_verified": True,
        "role": "admin",
        "created_at": "2025-10-08T15:00:00.000Z"
    }
    
    result = users_collection.insert_one(admin_user)
    print(f"✅ Fresh admin user created successfully with ID: {result.inserted_id}")
    
    print(f"\n🔑 New Admin login credentials:")
    print(f"Email: {admin_email}")
    print(f"Password: {admin_password}")
    
    # Verify by checking the user
    check_user = users_collection.find_one({"email": admin_email})
    if check_user:
        print(f"✅ User verification:")
        print(f"  Email: {check_user['email']}")
        print(f"  Is Admin: {check_user.get('is_admin', False)}")
        print(f"  Is Verified: {check_user.get('is_verified', False)}")
        
        # Test password
        stored_password = check_user['password'].encode('utf-8')
        if bcrypt.checkpw(admin_password.encode('utf-8'), stored_password):
            print(f"✅ Password verification successful")
        else:
            print(f"❌ Password verification failed")
    
    return admin_email, admin_password

if __name__ == "__main__":
    check_and_reset_admin()