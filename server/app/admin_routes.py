from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from .models import UserInDB
from .db import users_collection, complaints_collection, admin_notes_collection
from .auth_utils import verify_token, hash_password, verify_password, create_access_token, generate_otp, send_otp_email, get_otp_expiry
from .db import otp_collection
from .utils.json_utils import serialize_document
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
async def get_dashboard_stats(period: str = "today", current_admin: dict = Depends(get_current_admin)) -> Dict[str, Any]:
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
    
    # Build date filter supporting legacy documents
    date_filter = {
        "$or": [
            {"created_at": {"$gte": start_date}},
            {"submitted_date": {"$gte": start_date}}
        ]
    }

    # Total metrics
    total_complaints = complaints_collection.count_documents(date_filter)
    total_users = users_collection.count_documents({"is_admin": {"$ne": True}})

    status_regex = lambda value: {"$regex": f"^{value}$", "$options": "i"}

    # Status counts (case-insensitive)
    pending_complaints = complaints_collection.count_documents({**date_filter, "status": status_regex("pending")})
    in_progress_complaints = complaints_collection.count_documents({**date_filter, "status": status_regex("in_progress")})
    resolved_complaints = complaints_collection.count_documents({**date_filter, "status": status_regex("resolved")})

    # Priority counts (case-insensitive)
    high_priority = complaints_collection.count_documents({**date_filter, "priority": status_regex("high")})
    medium_priority = complaints_collection.count_documents({**date_filter, "priority": status_regex("medium")})
    low_priority = complaints_collection.count_documents({**date_filter, "priority": status_regex("low")})

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
        sort=[("created_at", -1), ("submitted_date", -1)],
        limit=10
    ))
    
    # Serialize the response
    return serialize_document({
        "totalComplaints": total_complaints,
        "totalUsers": total_users,
        "pendingComplaints": pending_complaints,
        "inProgressComplaints": in_progress_complaints,
        "resolvedComplaints": resolved_complaints,
        "highPriorityComplaints": high_priority,
        "mediumPriorityComplaints": medium_priority,
        "lowPriorityComplaints": low_priority,
        "highPriority": high_priority,
        "mediumPriority": medium_priority,
        "lowPriority": low_priority,
        "categories": categories,
        "recentComplaints": recent_complaints
    })

@router.get("/users")
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    current_admin: dict = Depends(get_current_admin)
):
    """Get all users for admin management"""
    
    # Get all non-admin users
    users = list(users_collection.find(
        {"is_admin": {"$ne": True}},
        sort=[("created_at", -1)],
        skip=skip,
        limit=limit
    ))
    
    # Add complaint count for each user
    for user in users:
        user_id = str(user["_id"])
        user["complaints_count"] = complaints_collection.count_documents({"user_id": user_id})
    
    # Serialize the documents for JSON response
    return serialize_document(users)

@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    update_data: dict,
    current_admin: dict = Depends(get_current_admin)
):
    """Update user information"""
    
    try:
        # Validate user_id format
        try:
            user_obj_id = ObjectId(user_id)
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        # Don't allow updating admin status through this endpoint
        if "is_admin" in update_data:
            del update_data["is_admin"]
        
        # Update user
        result = users_collection.update_one(
            {"_id": user_obj_id},
            {
                "$set": {
                    **update_data,
                    "updated_at": datetime.utcnow(),
                    "updated_by": current_admin["email"]
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {"message": "User updated successfully"}
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update user"
        )

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """Delete user (admin only)"""
    
    try:
        # Validate user_id format
        try:
            user_obj_id = ObjectId(user_id)
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        # Check if user exists and is not admin
        user = users_collection.find_one({"_id": user_obj_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.get("is_admin"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete admin users"
            )
        
        # Delete user
        result = users_collection.delete_one({"_id": user_obj_id})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {"message": "User deleted successfully"}
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete user"
        )

@router.delete("/complaints/{complaint_id}")
async def delete_complaint(
    complaint_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """Delete complaint (admin only)"""
    
    try:
        # Validate complaint_id format
        try:
            complaint_obj_id = ObjectId(complaint_id)
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid complaint ID format"
            )
        
        # Delete complaint
        result = complaints_collection.delete_one({"_id": complaint_obj_id})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found"
            )
        
        # Also delete associated admin notes
        admin_notes_collection.delete_many({"complaint_id": complaint_id})
        
        return {"message": "Complaint deleted successfully"}
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete complaint"
        )

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
    
    # Serialize the documents for JSON response
    return serialize_document(complaints)

@router.get("/complaints/{complaint_id}")
async def get_complaint_details(
    complaint_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """Get detailed complaint information"""
    
    try:
        # Get complaint
        try:
            complaint = complaints_collection.find_one({"_id": ObjectId(complaint_id)})
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid complaint ID format"
            )
            
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found"
            )
        
        # Get admin notes for this complaint
        notes = list(admin_notes_collection.find(
            {"complaint_id": complaint_id},
            sort=[("created_at", -1)]
        ))
        
        return serialize_document({
            "complaint": complaint,
            "notes": notes
        })
        
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
