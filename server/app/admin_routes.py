from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from typing import Optional, List
from datetime import datetime, timedelta
from .models import UserInDB
from .db import users_collection, complaints_collection, admin_notes_collection
from .auth_utils import verify_token, hash_password, verify_password, create_access_token, generate_otp, send_otp_email, get_otp_expiry
from .db import otp_collection
import json
from bson import ObjectId

router = APIRouter(prefix="/admin", tags=["Admin"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_admin(token: str = Depends(oauth2_scheme)):
    """Get current authenticated admin user"""
    email = verify_token(token)
    user = users_collection.find_one({"email": email})
    if user is None or not user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin access required"
        )
    return user

@router.get("/dashboard-stats")
async def get_dashboard_stats(period: str = "today", current_admin: dict = Depends(get_current_admin)):
    """Get dashboard statistics for admin"""
    
    # Calculate date range based on period
    now = datetime.utcnow()
    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    elif period == "year":
        start_date = now - timedelta(days=365)
    else:
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Get complaints in the date range
    date_filter = {"created_at": {"$gte": start_date}}
    
    # Total complaints
    total_complaints = complaints_collection.count_documents(date_filter)
    
    # Status counts
    pending_complaints = complaints_collection.count_documents({**date_filter, "status": "pending"})
    in_progress_complaints = complaints_collection.count_documents({**date_filter, "status": "in_progress"})
    resolved_complaints = complaints_collection.count_documents({**date_filter, "status": "resolved"})
    
    # Priority counts
    high_priority = complaints_collection.count_documents({**date_filter, "priority": "high"})
    medium_priority = complaints_collection.count_documents({**date_filter, "priority": "medium"})
    low_priority = complaints_collection.count_documents({**date_filter, "priority": "low"})
    
    # Category distribution
    pipeline = [
        {"$match": date_filter},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    category_results = list(complaints_collection.aggregate(pipeline))
    
    # Map categories to icons
    category_icons = {
        "water": "💧",
        "electricity": "⚡",
        "roads": "🛣️",
        "waste": "🗑️",
        "other": "📝"
    }
    
    categories = [
        {
            "name": result["_id"] or "Other",
            "count": result["count"],
            "icon": category_icons.get(result["_id"], "📝")
        }
        for result in category_results
    ]
    
    # Recent complaints
    recent_complaints = list(complaints_collection.find(
        date_filter,
        sort=[("created_at", -1)],
        limit=10
    ))
    
    # Convert ObjectId to string for JSON serialization
    for complaint in recent_complaints:
        complaint["id"] = str(complaint["_id"])
        complaint.pop("_id", None)
    
    return {
        "totalComplaints": total_complaints,
        "pendingComplaints": pending_complaints,
        "inProgressComplaints": in_progress_complaints,
        "resolvedComplaints": resolved_complaints,
        "highPriority": high_priority,
        "mediumPriority": medium_priority,
        "lowPriority": low_priority,
        "categories": categories,
        "recentComplaints": recent_complaints
    }

@router.get("/complaints")
async def get_all_complaints(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin)
):
    """Get all complaints for admin with filtering"""
    
    # Build filter
    filter_dict = {}
    if status:
        filter_dict["status"] = status
    if priority:
        filter_dict["priority"] = priority
    if category:
        filter_dict["category"] = category
    
    # Get complaints
    complaints = list(complaints_collection.find(
        filter_dict,
        sort=[("priority", -1), ("created_at", -1)],
        skip=skip,
        limit=limit
    ))
    
    # Convert ObjectId to string
    for complaint in complaints:
        complaint["id"] = str(complaint["_id"])
        complaint.pop("_id", None)
    
    return complaints

@router.get("/complaints/{complaint_id}")
async def get_complaint_details(
    complaint_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """Get detailed complaint information"""
    
    try:
        # Get complaint
        complaint = complaints_collection.find_one({"_id": ObjectId(complaint_id)})
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found"
            )
        
        # Convert ObjectId to string
        complaint["id"] = str(complaint["_id"])
        complaint.pop("_id", None)
        
        # Get admin notes for this complaint
        notes = list(admin_notes_collection.find(
            {"complaint_id": complaint_id},
            sort=[("created_at", -1)]
        ))
        
        # Convert ObjectId to string for notes
        for note in notes:
            note["id"] = str(note["_id"])
            note.pop("_id", None)
        
        return {
            "complaint": complaint,
            "notes": notes
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid complaint ID"
        )

@router.put("/complaints/{complaint_id}/status")
async def update_complaint_status(
    complaint_id: str,
    status_data: dict,
    current_admin: dict = Depends(get_current_admin)
):
    """Update complaint status"""
    
    new_status = status_data.get("status")
    if new_status not in ["pending", "in_progress", "resolved", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status"
        )
    
    try:
        result = complaints_collection.update_one(
            {"_id": ObjectId(complaint_id)},
            {
                "$set": {
                    "status": new_status,
                    "updated_at": datetime.utcnow(),
                    "updated_by": current_admin["email"]
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found"
            )
        
        return {"message": "Status updated successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid complaint ID"
        )

@router.put("/complaints/{complaint_id}/assign")
async def assign_complaint(
    complaint_id: str,
    assignment_data: dict,
    current_admin: dict = Depends(get_current_admin)
):
    """Assign complaint to department"""
    
    department = assignment_data.get("department")
    if not department:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department is required"
        )
    
    try:
        result = complaints_collection.update_one(
            {"_id": ObjectId(complaint_id)},
            {
                "$set": {
                    "assigned_department": department,
                    "updated_at": datetime.utcnow(),
                    "assigned_by": current_admin["email"]
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found"
            )
        
        return {"message": "Complaint assigned successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid complaint ID"
        )

@router.post("/complaints/{complaint_id}/notes")
async def add_complaint_note(
    complaint_id: str,
    note_data: dict,
    current_admin: dict = Depends(get_current_admin)
):
    """Add internal note to complaint"""
    
    note_text = note_data.get("note")
    if not note_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Note text is required"
        )
    
    # Create note document
    note_doc = {
        "complaint_id": complaint_id,
        "note": note_text,
        "admin_name": f"{current_admin.get('first_name', '')} {current_admin.get('last_name', '')}".strip() or current_admin["email"],
        "admin_email": current_admin["email"],
        "created_at": datetime.utcnow()
    }
    
    result = admin_notes_collection.insert_one(note_doc)
    
    return {"message": "Note added successfully", "note_id": str(result.inserted_id)}

@router.get("/notifications")
async def get_admin_notifications(current_admin: dict = Depends(get_current_admin)):
    """Get admin notifications"""
    
    # Get high priority complaints from last 24 hours
    yesterday = datetime.utcnow() - timedelta(days=1)
    high_priority_complaints = list(complaints_collection.find({
        "priority": "high",
        "created_at": {"$gte": yesterday},
        "status": {"$in": ["pending", "in_progress"]}
    }, limit=10))
    
    notifications = []
    for complaint in high_priority_complaints:
        notifications.append({
            "id": str(complaint["_id"]),
            "type": "high_priority",
            "title": "High Priority Complaint",
            "message": f"New high priority complaint: {complaint['message'][:100]}...",
            "created_at": complaint["created_at"],
            "complaint_id": str(complaint["_id"])
        })
    
    return notifications

@router.get("/settings")
async def get_admin_settings(current_admin: dict = Depends(get_current_admin)):
    """Get admin settings"""
    
    return {
        "departments": [
            "Water Department",
            "Electricity Board", 
            "Public Works",
            "Waste Management",
            "Municipal Corporation"
        ],
        "priorities": ["high", "medium", "low"],
        "statuses": ["pending", "in_progress", "resolved", "rejected"],
        "categories": ["water", "electricity", "roads", "waste", "other"]
    }

@router.put("/settings")
async def update_admin_settings(
    settings_data: dict,
    current_admin: dict = Depends(get_current_admin)
):
    """Update admin settings"""
    
    # This would typically update configuration in database
    # For now, just return success
    return {"message": "Settings updated successfully"}
