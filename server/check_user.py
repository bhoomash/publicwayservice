"""Check user data"""
from app.db import get_database

db = get_database()

# Get a user
user = db.users.find_one({"email": "gowthamvetriii@gmail.com"})
if user:
    print("\n👤 User Fields:")
    print("=" * 80)
    for key, value in sorted(user.items()):
        if key == '_id':
            print(f"{key}: {str(value)}")
        else:
            print(f"{key}: {value}")
else:
    print("❌ User not found")
    print("\nAll users:")
    for u in db.users.find().limit(3):
        print(f"  - {u.get('email')}: {list(u.keys())}")
