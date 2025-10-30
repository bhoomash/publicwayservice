"""Check what fields are in a specific complaint"""
from app.db import get_database
from bson import ObjectId
import json

db = get_database()

# Try both id formats
complaint = db.complaints.find_one({'id': '690396eecc48bcdd94645f9a'})
if not complaint:
    try:
        complaint = db.complaints.find_one({'_id': ObjectId('690396eecc48bcdd94645f9a')})
    except:
        # Just get any complaint
        complaint = db.complaints.find_one()

if complaint:
    print("\n📄 Complaint Fields and Values:")
    print("=" * 80)
    
    # Convert ObjectId and datetime to strings for display
    complaint_dict = {}
    for key, value in complaint.items():
        if key == '_id':
            complaint_dict[key] = str(value)
        else:
            complaint_dict[key] = value
    
    # Pretty print
    for key, value in sorted(complaint_dict.items()):
        if isinstance(value, dict):
            print(f"\n{key}:")
            for k, v in value.items():
                print(f"  {k}: {v}")
        else:
            # Truncate long values
            val_str = str(value)
            if len(val_str) > 100:
                val_str = val_str[:100] + "..."
            print(f"{key}: {val_str}")
    
    print("\n" + "=" * 80)
else:
    print("❌ Complaint not found")
