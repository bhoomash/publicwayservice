"""
Utility script to make a user an admin.
Run this script to grant admin privileges to a user.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import users_collection

def make_admin(email):
    """Make a user an admin"""
    result = users_collection.update_one(
        {"email": email},
        {"$set": {"is_admin": True}}
    )
    
    if result.modified_count == 1:
        print(f"✅ Successfully made {email} an admin")
    elif result.matched_count == 1:
        print(f"ℹ️ {email} is already an admin")
    else:
        print(f"❌ User {email} not found")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python make_admin.py <email>")
        sys.exit(1)
    
    email = sys.argv[1]
    make_admin(email)
