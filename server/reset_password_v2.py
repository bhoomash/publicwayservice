"""
Reset password using the same hashing function as the backend
"""
import sys
sys.path.insert(0, '.')

from app.auth_utils import hash_password
from app.db import users_collection

# Choose which user to reset
email = "anirudh200503@gmail.com"
new_password = "Test@123"

# Hash using the same function as backend
hashed = hash_password(new_password)

# Update the user
result = users_collection.update_one(
    {"email": email},
    {"$set": {"password": hashed}}
)

if result.modified_count > 0 or result.matched_count > 0:
    print("=" * 60)
    print(f"✅ Password reset successful!")
    print("=" * 60)
    print(f"\nLogin credentials:")
    print(f"   Email: {email}")
    print(f"   Password: {new_password}")
    print(f"\nLogin at: http://localhost:5173/login")
    print("=" * 60)
else:
    print(f"❌ User {email} not found")
