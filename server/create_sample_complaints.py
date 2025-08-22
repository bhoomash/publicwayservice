import os
from datetime import datetime, timedelta
from app.db import get_database
from bson import ObjectId

def create_sample_complaints():
    """Create sample complaints for testing admin dashboard"""
    db = get_database()
    complaints_collection = db.complaints
    
    # Sample complaints with different priorities
    sample_complaints = [
        {
            "title": "Water Pipeline Burst",
            "description": "Major water pipeline burst on Main Street causing flooding and water shortage in the entire neighborhood. Immediate attention required.",
            "category": "water",
            "priority": "high",
            "urgency": "high",
            "status": "pending",
            "citizen_id": ObjectId(),
            "citizen_name": "John Smith",
            "citizen_email": "john.smith@email.com",
            "citizen_phone": "+1234567890",
            "location": "Main Street, Block A",
            "address": "123 Main Street",
            "created_at": datetime.utcnow() - timedelta(hours=2),
            "updated_at": datetime.utcnow() - timedelta(hours=2),
            "priority_score": 95,
            "ai_analysis": "Critical infrastructure failure requiring immediate emergency response.",
            "estimated_resolution_time": "4-6 hours",
            "department": "Water Department"
        },
        {
            "title": "Street Light Not Working",
            "description": "Street light has been out for 3 days on Oak Avenue. Creating safety concerns for pedestrians at night.",
            "category": "electricity",
            "priority": "medium",
            "urgency": "medium",
            "status": "assigned",
            "citizen_id": ObjectId(),
            "citizen_name": "Sarah Johnson",
            "citizen_email": "sarah.j@email.com",
            "citizen_phone": "+1234567891",
            "location": "Oak Avenue, Block B",
            "address": "456 Oak Avenue",
            "created_at": datetime.utcnow() - timedelta(days=1),
            "updated_at": datetime.utcnow() - timedelta(hours=8),
            "priority_score": 65,
            "ai_analysis": "Public safety infrastructure issue requiring standard maintenance response.",
            "estimated_resolution_time": "1-2 days",
            "department": "Electrical Department",
            "assigned_to": "Tech Team A"
        },
        {
            "title": "Pothole on Secondary Road",
            "description": "Small pothole on Elm Street near the park. Not causing major issues but should be fixed.",
            "category": "roads",
            "priority": "low",
            "urgency": "low",
            "status": "pending",
            "citizen_id": ObjectId(),
            "citizen_name": "Mike Davis",
            "citizen_email": "mike.davis@email.com",
            "citizen_phone": "+1234567892",
            "location": "Elm Street, Near Park",
            "address": "789 Elm Street",
            "created_at": datetime.utcnow() - timedelta(days=5),
            "updated_at": datetime.utcnow() - timedelta(days=5),
            "priority_score": 35,
            "ai_analysis": "Minor road maintenance issue for scheduled repair.",
            "estimated_resolution_time": "1-2 weeks",
            "department": "Road Maintenance"
        },
        {
            "title": "Garbage Collection Missed",
            "description": "Garbage collection has been missed for 2 weeks in our area. Bins are overflowing and creating health hazards.",
            "category": "waste",
            "priority": "high",
            "urgency": "high",
            "status": "in_progress",
            "citizen_id": ObjectId(),
            "citizen_name": "Emily Wilson",
            "citizen_email": "emily.w@email.com",
            "citizen_phone": "+1234567893",
            "location": "Pine Street, Residential Area",
            "address": "321 Pine Street",
            "created_at": datetime.utcnow() - timedelta(days=3),
            "updated_at": datetime.utcnow() - timedelta(hours=4),
            "priority_score": 85,
            "ai_analysis": "Sanitation service disruption with health implications requiring urgent response.",
            "estimated_resolution_time": "24-48 hours",
            "department": "Waste Management",
            "assigned_to": "Sanitation Team B"
        },
        {
            "title": "Noise Complaint - Construction",
            "description": "Construction work starting too early (5 AM) and violating noise regulations. Disturbing residents' sleep.",
            "category": "other",
            "priority": "medium",
            "urgency": "medium",
            "status": "resolved",
            "citizen_id": ObjectId(),
            "citizen_name": "Robert Brown",
            "citizen_email": "robert.b@email.com",
            "citizen_phone": "+1234567894",
            "location": "Cedar Lane, Construction Site",
            "address": "654 Cedar Lane",
            "created_at": datetime.utcnow() - timedelta(days=7),
            "updated_at": datetime.utcnow() - timedelta(days=1),
            "priority_score": 55,
            "ai_analysis": "Noise regulation violation requiring compliance enforcement.",
            "estimated_resolution_time": "2-3 days",
            "department": "Code Enforcement",
            "assigned_to": "Inspector Smith",
            "resolution_note": "Contractor notified of noise regulations. Work hours adjusted to comply with city ordinance."
        },
        {
            "title": "Broken Traffic Signal",
            "description": "Traffic signal at the intersection of Main St and 5th Ave is malfunctioning. All lights are flashing red.",
            "category": "roads",
            "priority": "high",
            "urgency": "high",
            "status": "assigned",
            "citizen_id": ObjectId(),
            "citizen_name": "Lisa Martinez",
            "citizen_email": "lisa.m@email.com",
            "citizen_phone": "+1234567895",
            "location": "Main St & 5th Ave Intersection",
            "address": "Main St & 5th Ave",
            "created_at": datetime.utcnow() - timedelta(hours=6),
            "updated_at": datetime.utcnow() - timedelta(hours=3),
            "priority_score": 90,
            "ai_analysis": "Critical traffic infrastructure failure requiring immediate emergency response to prevent accidents.",
            "estimated_resolution_time": "2-4 hours",
            "department": "Traffic Department",
            "assigned_to": "Emergency Response Team"
        },
        {
            "title": "Park Bench Needs Repair",
            "description": "Park bench in Central Park has broken slats. Not dangerous but uncomfortable to sit on.",
            "category": "other",
            "priority": "low",
            "urgency": "low",
            "status": "pending",
            "citizen_id": ObjectId(),
            "citizen_name": "Amanda Lee",
            "citizen_email": "amanda.lee@email.com",
            "citizen_phone": "+1234567896",
            "location": "Central Park, Near Playground",
            "address": "Central Park",
            "created_at": datetime.utcnow() - timedelta(days=10),
            "updated_at": datetime.utcnow() - timedelta(days=10),
            "priority_score": 25,
            "ai_analysis": "Minor park maintenance issue for routine repair schedule.",
            "estimated_resolution_time": "2-4 weeks",
            "department": "Parks & Recreation"
        },
        {
            "title": "Sewer Overflow",
            "description": "Sewer is overflowing on Maple Street during heavy rain. Creating unsanitary conditions and bad smell.",
            "category": "water",
            "priority": "high",
            "urgency": "high",
            "status": "in_progress",
            "citizen_id": ObjectId(),
            "citizen_name": "Tom Wilson",
            "citizen_email": "tom.w@email.com",
            "citizen_phone": "+1234567897",
            "location": "Maple Street, Residential Area",
            "address": "890 Maple Street",
            "created_at": datetime.utcnow() - timedelta(days=1),
            "updated_at": datetime.utcnow() - timedelta(hours=6),
            "priority_score": 88,
            "ai_analysis": "Sewer infrastructure failure with health and environmental implications requiring urgent attention.",
            "estimated_resolution_time": "6-12 hours",
            "department": "Water & Sewer Department",
            "assigned_to": "Emergency Sewer Team"
        }
    ]
    
    try:
        # Clear existing sample complaints (optional)
        print("Adding sample complaints...")
        
        # Insert sample complaints
        result = complaints_collection.insert_many(sample_complaints)
        print(f"Successfully created {len(result.inserted_ids)} sample complaints")
        
        # Print summary
        high_priority = len([c for c in sample_complaints if c['priority'] == 'high'])
        medium_priority = len([c for c in sample_complaints if c['priority'] == 'medium'])
        low_priority = len([c for c in sample_complaints if c['priority'] == 'low'])
        
        print(f"\nComplaint Summary:")
        print(f"High Priority: {high_priority} complaints")
        print(f"Medium Priority: {medium_priority} complaints")
        print(f"Low Priority: {low_priority} complaints")
        print(f"Total: {len(sample_complaints)} complaints")
        
        return True
        
    except Exception as e:
        print(f"Error creating sample complaints: {e}")
        return False

if __name__ == "__main__":
    create_sample_complaints()
