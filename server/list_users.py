"""
List all users in MongoDB
"""
from pymongo import MongoClient
import json

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")

# Check both possible database names
for db_name in ["gov_portal", "grievancebot", "government_portal"]:
    db = client[db_name]
    users_collection = db["users"]
    count = users_collection.count_documents({})
    if count > 0:
        print(f"\n✅ Found {count} users in database: {db_name}")
        break
else:
    db = client["gov_portal"]  # default
    users_collection = db["users"]

# Get all users
users = list(users_collection.find({}, {
    "email": 1, 
    "first_name": 1, 
    "last_name": 1, 
    "is_verified": 1, 
    "is_admin": 1,
    "role": 1
}))

print("=" * 60)
print(f"Total users in database: {len(users)}")
print("=" * 60)

for i, user in enumerate(users, 1):
    print(f"\n{i}. Email: {user.get('email')}")
    print(f"   Name: {user.get('first_name', '')} {user.get('last_name', '')}")
    print(f"   Role: {user.get('role', 'N/A')}")
    print(f"   Admin: {user.get('is_admin', False)}")
    print(f"   Verified: {user.get('is_verified', False)}")

print("\n" + "=" * 60)
