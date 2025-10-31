"""Test admin complaints endpoint"""
from app.db import get_database

def test_admin_complaints():
    """Test getting all complaints as admin would"""
    db = get_database()
    complaints_collection = db.complaints
    
    # Get all complaints
    complaints = list(complaints_collection.find(
        {},
        sort=[("priority", -1), ("created_at", -1)],
        limit=100
    ))
    
    print(f"\n📊 Total complaints in database: {len(complaints)}")
    
    if complaints:
        print("\n✅ Sample complaint structure:")
        sample = complaints[0]
        print(f"   Fields available:")
        for key in sorted(sample.keys()):
            value = sample[key]
            if isinstance(value, str) and len(str(value)) > 50:
                print(f"   - {key}: {str(value)[:50]}...")
            else:
                print(f"   - {key}: {value}")
    
    # Check for required fields
    print("\n🔍 Checking data quality:")
    missing_id = 0
    missing_message = 0
    missing_user = 0
    
    for complaint in complaints:
        if not complaint.get('id'):
            missing_id += 1
        if not (complaint.get('message') or complaint.get('description') or complaint.get('title')):
            missing_message += 1
        if not complaint.get('user_name'):
            missing_user += 1
    
    print(f"   - Complaints missing 'id': {missing_id}")
    print(f"   - Complaints missing message/description: {missing_message}")
    print(f"   - Complaints missing user_name: {missing_user}")
    
    # Priority breakdown
    high = len([c for c in complaints if (c.get('priority') or 'low').lower() == 'high'])
    medium = len([c for c in complaints if (c.get('priority') or 'low').lower() == 'medium'])
    low = len([c for c in complaints if (c.get('priority') or 'low').lower() == 'low'])
    
    print(f"\n📈 Priority breakdown:")
    print(f"   - High: {high}")
    print(f"   - Medium: {medium}")
    print(f"   - Low: {low}")
    
    # Status breakdown
    pending = len([c for c in complaints if (c.get('status') or 'pending').lower() == 'pending'])
    in_progress = len([c for c in complaints if (c.get('status') or '').lower() == 'in_progress'])
    resolved = len([c for c in complaints if (c.get('status') or '').lower() == 'resolved'])
    
    print(f"\n📋 Status breakdown:")
    print(f"   - Pending: {pending}")
    print(f"   - In Progress: {in_progress}")
    print(f"   - Resolved: {resolved}")
    
    print("\n✅ Admin complaints endpoint should return all this data!")

if __name__ == "__main__":
    test_admin_complaints()
