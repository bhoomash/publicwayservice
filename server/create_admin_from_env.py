import os
import bcrypt
from dotenv import load_dotenv
from app.db import get_database

def create_admin_from_env():
    """Create admin user using credentials from .env file"""
    
    # Load environment variables
    load_dotenv()
    
    admin_email = os.getenv('admin_email')
    admin_password = os.getenv('admin_password')
    
    if not admin_email or not admin_password:
        print("Error: admin_email and admin_password must be set in .env file")
        return
    
    print(f"Creating admin user with email: {admin_email}")
    
    try:
        db = get_database()
        users_collection = db.users
        
        # Check if admin already exists
        existing_admin = users_collection.find_one({"email": admin_email})
        
        if existing_admin:
            print(f"Admin user already exists: {admin_email}")
            print(f"Current status:")
            print(f"  - Is admin: {existing_admin.get('is_admin', False)}")
            print(f"  - Is verified: {existing_admin.get('is_verified', False)}")
            
            # Update existing user to ensure admin privileges
            update_result = users_collection.update_one(
                {"email": admin_email},
                {
                    "$set": {
                        "is_admin": True,
                        "is_verified": True,
                        "password": bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                    }
                }
            )
            
            if update_result.modified_count > 0:
                print("✅ Admin user updated successfully!")
                print("  - Admin privileges: Enabled")
                print("  - Email verification: Enabled")
                print("  - Password: Updated")
            else:
                print("ℹ️ Admin user already up to date")
                
        else:
            # Hash the password
            hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt())
            
            # Create new admin user
            admin_user = {
                "first_name": "Admin",
                "last_name": "User",
                "email": admin_email,
                "phone": "+1234567890",
                "password": hashed_password.decode('utf-8'),
                "is_admin": True,
                "is_verified": True,
                "bio": "System Administrator",
                "address": "Administrative Office",
                "profile_picture": None,
                "created_at": "2025-08-22T00:00:00Z",
                "updated_at": "2025-08-22T00:00:00Z"
            }
            
            result = users_collection.insert_one(admin_user)
            print(f"✅ Admin user created successfully!")
            print(f"  - User ID: {result.inserted_id}")
            print(f"  - Email: {admin_email}")
            print(f"  - Admin privileges: Enabled")
            print(f"  - Email verification: Enabled")
        
        print(f"\n🔐 Admin Login Credentials:")
        print(f"Email: {admin_email}")
        print(f"Password: {admin_password}")
        print(f"\n🌐 Admin Login URL: http://localhost:5173/admin/login")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_admin_from_env()
