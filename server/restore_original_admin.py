import bcrypt
from app.db import get_database

def restore_original_admin():
    """Restore the original admin credentials"""
    db = get_database()
    users_collection = db.users
    
    # Original admin credentials
    admin_email = "anirudh200503@gmail.com"
    admin_password = "Anirudh123@"
    
    # Delete current admin
    users_collection.delete_many({"email": "admin@gov-portal.com"})
    users_collection.delete_many({"email": admin_email})
    
    # Hash the password
    hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt())
    
    # Create admin user with original credentials
    admin_user = {
        "email": admin_email,
        "password": hashed_password.decode('utf-8'),
        "first_name": "Anirudh",
        "last_name": "T",
        "phone": "+1234567890",
        "is_admin": True,
        "is_verified": True,
        "role": "admin",
        "created_at": "2025-10-08T15:00:00.000Z"
    }
    
    result = users_collection.insert_one(admin_user)
    print(f"✅ Original admin user restored successfully with ID: {result.inserted_id}")
    
    print(f"\n🔑 Restored Admin login credentials:")
    print(f"Email: {admin_email}")
    print(f"Password: {admin_password}")
    
    # Verify by checking the user
    check_user = users_collection.find_one({"email": admin_email})
    if check_user:
        print(f"✅ User verification:")
        print(f"  Email: {check_user['email']}")
        print(f"  Name: {check_user.get('first_name', '')} {check_user.get('last_name', '')}")
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
    restore_original_admin()