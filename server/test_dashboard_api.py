import requests
import json

def test_dashboard_api():
    """Test the dashboard stats API to check response structure"""
    
    # First, let's test without authentication to see the response
    try:
        url = "http://localhost:8000/admin/dashboard-stats"
        print(f"Testing URL: {url}")
        
        # This will likely fail due to auth, but we can see the response structure
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 401:
            print("Authentication required (expected)")
            print(f"Response: {response.text}")
        else:
            print(f"Response: {response.json()}")
            
    except Exception as e:
        print(f"Error: {e}")

    # Now let's check the database directly to see what the API should return
    print("\n" + "="*50)
    print("Checking database directly...")
    
    try:
        from app.db import get_database
        db = get_database()
        complaints_collection = db.complaints
        users_collection = db.users
        
        # Get basic counts
        total_complaints = complaints_collection.count_documents({})
        total_users = users_collection.count_documents({"is_admin": {"$ne": True}})
        
        # Status counts
        pending = complaints_collection.count_documents({"status": {"$regex": "^pending$", "$options": "i"}})
        in_progress = complaints_collection.count_documents({"status": {"$regex": "^in_progress$", "$options": "i"}})
        resolved = complaints_collection.count_documents({"status": {"$regex": "^resolved$", "$options": "i"}})
        
        # Priority counts
        high_priority = complaints_collection.count_documents({"priority": {"$regex": "^high$", "$options": "i"}})
        medium_priority = complaints_collection.count_documents({"priority": {"$regex": "^medium$", "$options": "i"}})
        low_priority = complaints_collection.count_documents({"priority": {"$regex": "^low$", "$options": "i"}})
        
        print(f"Total Complaints: {total_complaints}")
        print(f"Total Users: {total_users}")
        print(f"Pending: {pending}")
        print(f"In Progress: {in_progress}")
        print(f"Resolved: {resolved}")
        print(f"High Priority: {high_priority}")
        print(f"Medium Priority: {medium_priority}")
        print(f"Low Priority: {low_priority}")
        
        # Show recent complaints
        recent = list(complaints_collection.find({}).sort("created_at", -1).limit(3))
        print(f"\nRecent complaints:")
        for complaint in recent:
            print(f"- {complaint.get('title', complaint.get('message', 'No title'))[:50]}...")
            print(f"  Status: {complaint.get('status')}, Priority: {complaint.get('priority')}")
            
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    test_dashboard_api()