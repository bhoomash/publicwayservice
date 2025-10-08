from app.db import get_database
from datetime import datetime

def check_complaints():
    """Check current complaints in database"""
    db = get_database()
    complaints_collection = db.complaints
    
    # Get all complaints
    complaints = list(complaints_collection.find({}))
    
    print(f"Total complaints in database: {len(complaints)}")
    print("=" * 50)
    
    if complaints:
        for i, complaint in enumerate(complaints[:10], 1):
            title = complaint.get('title', complaint.get('message', 'No title'))
            status = complaint.get('status', 'unknown')
            priority = complaint.get('priority', 'unknown')
            created = complaint.get('created_at', complaint.get('submitted_date', 'unknown'))
            
            print(f"{i}. {title[:60]}...")
            print(f"   Status: {status}, Priority: {priority}")
            print(f"   Created: {created}")
            print("-" * 40)
    else:
        print("No complaints found in database")

if __name__ == "__main__":
    check_complaints()