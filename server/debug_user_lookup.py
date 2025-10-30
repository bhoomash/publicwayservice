"""Debug user ID matching"""
from app.db import get_database
from bson import ObjectId

db = get_database()

complaint = db.complaints.find_one({"_id": ObjectId("690396eecc48bcdd94645f9a")})
if complaint:
    user_id = complaint.get("user_id")
    print(f"Complaint user_id: {user_id}")
    print(f"Type: {type(user_id)}")
    
    # Try different lookups
    print("\n1. Looking up by _id (exact):")
    user = db.users.find_one({"_id": user_id})
    print(f"   Result: {user.get('first_name') if user else 'NOT FOUND'}")
    
    print("\n2. Looking up by _id (as ObjectId):")
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
        print(f"   Result: {user.get('first_name') if user else 'NOT FOUND'}")
    except:
        print("   NOT an ObjectId")
    
    print("\n3. Looking up by _id (as string):")
    user = db.users.find_one({"_id": str(user_id)})
    print(f"   Result: {user.get('first_name') if user else 'NOT FOUND'}")
    
    print("\n4. All users in database:")
    for u in db.users.find().limit(3):
        print(f"   - _id: {u['_id']} (type: {type(u['_id'])}), name: {u.get('first_name', '')  } {u.get('last_name', '')}")
