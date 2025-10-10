from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from .models import User
from .auth_utils import get_current_user
from .db import get_database
import uuid

router = APIRouter(prefix="/notifications", tags=["notifications"])

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    is_read: bool
    timestamp: datetime
    related_complaint_id: Optional[str] = None
    problem_type: Optional[str] = None
    department: Optional[str] = None
    urgency: Optional[str] = None

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    current_user: User = Depends(get_current_user),
    is_read: Optional[bool] = None,
    limit: int = 50
):
    """Get user notifications"""
    try:
        db = get_database()
        notifications_collection = db.notifications
        
        # Build query
        query = {"user_id": current_user["user_id"]}
        if is_read is not None:
            query["is_read"] = is_read
        
        # Fetch notifications
        notifications_cursor = notifications_collection.find(query).sort("timestamp", -1).limit(limit)
        notifications = list(notifications_cursor)
        
        # Convert to response format
        response_notifications = []
        for notification in notifications:
            response_notifications.append(NotificationResponse(**notification))
        
        return response_notifications
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching notifications: {str(e)}")

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read"""
    try:
        db = get_database()
        notifications_collection = db.notifications
        
        result = notifications_collection.update_one(
            {"id": notification_id, "user_id": current_user["user_id"]},
            {"$set": {"is_read": True}}
        )
        
        if result.modified_count > 0:
            return {"success": True, "message": "Notification marked as read"}
        else:
            raise HTTPException(status_code=404, detail="Notification not found")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating notification: {str(e)}")

@router.put("/mark-all-read")
async def mark_all_notifications_read(current_user: User = Depends(get_current_user)):
    """Mark all notifications as read for the current user"""
    try:
        db = get_database()
        notifications_collection = db.notifications
        
        result = notifications_collection.update_many(
            {"user_id": current_user["user_id"], "is_read": False},
            {"$set": {"is_read": True}}
        )
        
        return {
            "success": True, 
            "message": f"Marked {result.modified_count} notifications as read"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating notifications: {str(e)}")

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a notification"""
    try:
        db = get_database()
        notifications_collection = db.notifications
        
        result = notifications_collection.delete_one(
            {"id": notification_id, "user_id": current_user["user_id"]}
        )
        
        if result.deleted_count > 0:
            return {"success": True, "message": "Notification deleted"}
        else:
            raise HTTPException(status_code=404, detail="Notification not found")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting notification: {str(e)}")

@router.get("/unread-count")
async def get_unread_count(current_user: User = Depends(get_current_user)):
    """Get count of unread notifications"""
    try:
        db = get_database()
        notifications_collection = db.notifications
        
        count = notifications_collection.count_documents({
            "user_id": current_user["user_id"],
            "is_read": False
        })
        
        return {"unread_count": count}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error counting notifications: {str(e)}")

@router.post("/test/create-sample")
async def create_sample_notifications(current_user: User = Depends(get_current_user)):
    """Create sample notifications for testing (development only)"""
    try:
        sample_notifications = [
            {
                "title": "Road Repair Request Submitted",
                "message": "Your road repair complaint for Main Street has been submitted and assigned to the Transport Department.",
                "type": "submitted",
                "problem_type": "road",
                "department": "Transport Department",
                "urgency": "high",
                "related_complaint_id": "CMP001"
            },
            {
                "title": "Water Supply Issue Resolved",
                "message": "Great news! Your water supply complaint has been successfully resolved by the Water Department.",
                "type": "resolved",
                "problem_type": "water",
                "department": "Water Department", 
                "urgency": "medium",
                "related_complaint_id": "CMP002"
            },
            {
                "title": "Street Light Status Update",
                "message": "Your street light complaint is now in progress. Our electrical team is working on it.",
                "type": "status_update",
                "problem_type": "street_light",
                "department": "Electricity Department",
                "urgency": "low",
                "related_complaint_id": "CMP003"
            },
            {
                "title": "Garbage Collection Scheduled", 
                "message": "Your garbage collection complaint has been assigned to the Sanitation Department.",
                "type": "status_update",
                "problem_type": "garbage",
                "department": "Sanitation Department",
                "urgency": "medium",
                "related_complaint_id": "CMP004"
            }
        ]
        
        created_notifications = []
        for notif in sample_notifications:
            result = await create_notification(
                user_id=current_user["user_id"],
                title=notif["title"],
                message=notif["message"],
                type=notif["type"],
                related_complaint_id=notif["related_complaint_id"],
                problem_type=notif["problem_type"],
                department=notif["department"],
                urgency=notif["urgency"]
            )
            if result:
                created_notifications.append(result)
        
        return {
            "success": True,
            "message": f"Created {len(created_notifications)} sample notifications",
            "notifications": created_notifications
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating sample notifications: {str(e)}")

async def create_notification(user_id: str, title: str, message: str, type: str, related_complaint_id: str = None, problem_type: str = None, department: str = None, urgency: str = None):
    """Helper function to create notifications with complaint details"""
    try:
        db = get_database()
        notifications_collection = db.notifications
        
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": type,
            "is_read": False,
            "timestamp": datetime.utcnow(),
            "related_complaint_id": related_complaint_id,
            "problem_type": problem_type,
            "department": department,
            "urgency": urgency
        }
        
        notifications_collection.insert_one(notification)
        return notification
    except Exception as e:
        print(f"Error creating notification: {e}")
        return None
