from app.db import get_database

def remove_sample_complaints():
    """Remove only the sample complaints created by the script"""
    db = get_database()
    complaints_collection = db.complaints
    
    # Sample complaint titles to remove
    sample_titles = [
        "Water Pipeline Burst",
        "Street Light Not Working",
        "Pothole on Secondary Road",
        "Garbage Collection Missed",
        "Noise Complaint - Construction",
        "Broken Traffic Signal",
        "Park Bench Needs Repair",
        "Sewer Overflow"
    ]
    
    # Find and remove sample complaints
    for title in sample_titles:
        result = complaints_collection.delete_many({"title": title})
        if result.deleted_count > 0:
            print(f"Deleted {result.deleted_count} complaints with title: {title}")
    
    # Check remaining complaints
    remaining = complaints_collection.count_documents({})
    print(f"\nRemaining complaints in database: {remaining}")
    
    # Show remaining complaint titles
    remaining_complaints = list(complaints_collection.find({}, {"title": 1, "message": 1, "status": 1, "priority": 1}))
    print("\nRemaining complaints:")
    for i, complaint in enumerate(remaining_complaints, 1):
        title = complaint.get('title', complaint.get('message', 'No title'))[:60]
        status = complaint.get('status', 'unknown')
        priority = complaint.get('priority', 'unknown')
        print(f"{i}. {title}... (Status: {status}, Priority: {priority})")

if __name__ == "__main__":
    remove_sample_complaints()