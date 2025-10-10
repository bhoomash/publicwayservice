from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import json
from .models import UserResponse
from .auth_utils import get_current_user
from .db import get_database
from .ai_service import AIService
from .notification_routes import create_notification
from .rag_modules.pipeline import RAGPipeline
import uuid

router = APIRouter(prefix="/complaints", tags=["complaints"])

# Pydantic models
class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    location: str
    contact_phone: str
    contact_email: str
    urgency: str = "medium"

class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    assigned_department: Optional[str] = None
    admin_notes: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    title: str
    description: str
    category: Optional[str] = None
    location: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    urgency: Optional[str] = "medium"
    status: Optional[str] = "pending"
    priority_score: Optional[int] = 50
    assigned_department: Optional[str] = None
    ai_response: Optional[str] = None
    ai_category: Optional[str] = None
    ai_department: Optional[str] = None
    estimated_resolution: Optional[str] = None
    submitted_date: Optional[datetime] = None
    last_updated: Optional[datetime] = None
    attachments: List[str] = []
    vector_db_id: Optional[str] = None
    rag_summary: Optional[str] = None
    rag_department: Optional[str] = None
    rag_urgency: Optional[str] = None
    rag_location: Optional[str] = None
    rag_color: Optional[str] = None
    rag_emoji: Optional[str] = None
    rag_text_length: Optional[int] = None
    rag_metadata: Optional[dict] = None

# Initialize AI service
ai_service = AIService()
rag_pipeline = RAGPipeline()

def transform_complaint_for_response(complaint_doc):
    """Transform MongoDB complaint document to ComplaintResponse format"""
    # Handle _id to id transformation
    if "_id" in complaint_doc:
        complaint_doc["id"] = complaint_doc.get("id") or str(complaint_doc["_id"])
        del complaint_doc["_id"]
    
    # Ensure required fields have default values
    defaults = {
        "user_name": complaint_doc.get("user_name", ""),
        "user_email": complaint_doc.get("user_email", ""),
        "category": complaint_doc.get("category", "general"),
        "location": complaint_doc.get("location", ""),
        "contact_phone": complaint_doc.get("contact_phone", ""),
        "contact_email": complaint_doc.get("contact_email", ""),
        "urgency": complaint_doc.get("urgency", "medium"),
        "status": complaint_doc.get("status", "pending"),
        "priority_score": complaint_doc.get("priority_score", 50),
        "assigned_department": complaint_doc.get("assigned_department", ""),
        "ai_response": complaint_doc.get("ai_response", ""),
        "ai_category": complaint_doc.get("ai_category", ""),
        "ai_department": complaint_doc.get("ai_department", ""),
        "estimated_resolution": complaint_doc.get("estimated_resolution", ""),
        "submitted_date": complaint_doc.get("submitted_date") or complaint_doc.get("created_at"),
        "last_updated": complaint_doc.get("last_updated") or complaint_doc.get("created_at"),
        "attachments": complaint_doc.get("attachments", [])
    }
    
    # Update complaint_doc with defaults for missing fields
    for key, default_value in defaults.items():
        if key not in complaint_doc or complaint_doc[key] is None:
            complaint_doc[key] = default_value
    
    return complaint_doc

@router.post("/new", response_model=dict)
async def submit_complaint(
    complaint: ComplaintCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Submit a new complaint with AI processing"""
    try:
        db = get_database()
        complaints_collection = db.complaints
        
        # Generate complaint ID
        complaint_id = f"CMP{uuid.uuid4().hex[:6].upper()}"
        submitted_time = datetime.utcnow()
        status_value = "pending"
        priority_map = {
            "urgent": "high",
            "high": "high",
            "medium": "medium",
            "low": "low"
        }
        urgency_lower = complaint.urgency.lower() if complaint.urgency else "medium"
        priority_value = priority_map.get(urgency_lower, "medium")

        # First, process complaint through RAG pipeline
        try:
            rag_result = rag_pipeline.process_text_complaint(
                title=complaint.title,
                description=complaint.description,
                metadata={
                    "complaint_id": complaint_id,
                    "user_id": current_user["user_id"],
                    "user_email": current_user["email"],
                    "category_input": complaint.category,
                    "urgency_input": complaint.urgency,
                    "location_input": complaint.location
                }
            )
        except Exception as rag_error:
            raise HTTPException(status_code=500, detail=f"RAG processing failed: {str(rag_error)}")

        if not rag_result.get("is_relevant", True):
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Your submission doesn't appear to describe a civic complaint that the government portal can address.",
                    "reason": rag_result.get("relevance_reason", "No justification provided"),
                    "confidence": rag_result.get("relevance_confidence", 0.0),
                    "category": rag_result.get("relevance_category", "unknown"),
                    "summary": rag_result.get("summary", "")
                }
            )
        
        # AI Processing
        ai_analysis = await ai_service.analyze_complaint(
            title=complaint.title,
            description=complaint.description,
            urgency=complaint.urgency,
            location=complaint.location
        )
        
        # Create complaint document
        complaint_doc = {
            "id": complaint_id,
            "user_id": current_user["user_id"],
            "user_name": current_user["full_name"],
            "user_email": current_user["email"],
            "title": complaint.title,
            "description": complaint.description,
            "category": rag_result.get("department") or ai_analysis["category"],
            "location": complaint.location,
            "contact_phone": complaint.contact_phone,
            "contact_email": complaint.contact_email,
            "urgency": complaint.urgency,
            "status": status_value,
            "priority": priority_value,
            "priority_score": ai_analysis["priority_score"],
            "assigned_department": ai_analysis["assigned_department"],
            "ai_response": ai_analysis["suggested_response"],
            "ai_category": ai_analysis["category"],
            "ai_department": ai_analysis["assigned_department"],
            "estimated_resolution": ai_analysis["estimated_resolution"],
            "submitted_date": submitted_time,
            "last_updated": submitted_time,
            "created_at": submitted_time,
            "updated_at": submitted_time,
            "attachments": [],
            "vector_db_id": rag_result["document_id"],
            "rag_summary": rag_result["summary"],
            "rag_department": rag_result["department"],
            "rag_urgency": rag_result["urgency"],
            "rag_location": rag_result["location"],
            "rag_color": rag_result["color"],
            "rag_emoji": rag_result["emoji"],
            "rag_text_length": rag_result["text_length"],
            "rag_metadata": rag_result.get("metadata", {}),
            "status_history": [
                {
                    "status": status_value,
                    "timestamp": submitted_time,
                    "note": "Complaint submitted, processed by RAG and AI analysis"
                }
            ]
        }
        
        # Insert into database
        result = complaints_collection.insert_one(complaint_doc)
        
        if result.inserted_id:
            # Create notification with complaint details
            await create_notification(
                user_id=current_user["user_id"],
                title="Complaint Submitted",
                message=f"Your complaint '{complaint.title}' has been submitted and processed by the RAG intelligence pipeline.",
                type="submitted",
                related_complaint_id=complaint_id,
                problem_type=rag_result.get("department", "general").lower().replace(" ", "_"),
                department=rag_result.get("department"),
                urgency=complaint.urgency
            )
            rag_payload = {
                "document_id": rag_result["document_id"],
                "summary": rag_result["summary"],
                "urgency": rag_result["urgency"],
                "department": rag_result["department"],
                "location": rag_result["location"],
                "color": rag_result["color"],
                "emoji": rag_result["emoji"],
                "text_length": rag_result["text_length"]
            }

            return {
                "success": True,
                "complaint_id": complaint_id,
                "vector_db_id": rag_result["document_id"],
                "rag_analysis": rag_payload,
                "ai_summary": {
                    "category": ai_analysis["category"],
                    "priority_score": ai_analysis["priority_score"],
                    "assigned_department": ai_analysis["assigned_department"],
                    "suggested_response": ai_analysis["suggested_response"],
                    "estimated_resolution": ai_analysis["estimated_resolution"]
                }
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to submit complaint")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting complaint: {str(e)}")

@router.get("/my-complaints", response_model=List[ComplaintResponse])
async def get_my_complaints(
    current_user: UserResponse = Depends(get_current_user),
    status: Optional[str] = None,
    category: Optional[str] = None
):
    """Get current user's complaints"""
    try:
        db = get_database()
        complaints_collection = db.complaints
        
        # Build query
        query = {"user_id": current_user["user_id"]}
        if status:
            query["status"] = status
        if category:
            query["category"] = category
        
        # Fetch complaints
        complaints_cursor = complaints_collection.find(query).sort("submitted_date", -1)
        complaints = list(complaints_cursor)
        
        # Convert to response format
        response_complaints = []
        for complaint in complaints:
            transformed_complaint = transform_complaint_for_response(complaint.copy())
            response_complaints.append(ComplaintResponse(**transformed_complaint))
        
        return response_complaints
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching complaints: {str(e)}")

@router.get("/user/{user_id}", response_model=List[ComplaintResponse])
async def get_user_complaints_by_id(
    user_id: str,
    current_user: UserResponse = Depends(get_current_user),
    status: Optional[str] = None,
    category: Optional[str] = None,
    limit: Optional[int] = None
):
    """Get complaints for a specific user"""
    try:
        db = get_database()
        complaints_collection = db.complaints
        
        # If requesting another user's complaints, check permissions
        if user_id != current_user["user_id"]:
            if current_user.get("role") not in ["admin", "collector"]:
                raise HTTPException(status_code=403, detail="Access denied - can only view own complaints")
        
        # Build query
        query = {"user_id": user_id}
        if status:
            query["status"] = status
        if category:
            query["category"] = category
        
        # Fetch complaints with optional limit
        complaints_cursor = complaints_collection.find(query).sort("submitted_date", -1)
        if limit:
            complaints_cursor = complaints_cursor.limit(limit)
        
        complaints = list(complaints_cursor)
        
        # Convert to response format
        response_complaints = []
        for complaint in complaints:
            transformed_complaint = transform_complaint_for_response(complaint.copy())
            response_complaints.append(ComplaintResponse(**transformed_complaint))
        
        return response_complaints
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user complaints: {str(e)}")

@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint_details(
    complaint_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get detailed information about a specific complaint"""
    try:
        db = get_database()
        complaints_collection = db.complaints
        
        # Find complaint
        complaint = complaints_collection.find_one({"id": complaint_id})
        
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        # Check if user owns the complaint (for regular users)
        if current_user.get("role") != "admin" and complaint["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        transformed_complaint = transform_complaint_for_response(complaint.copy())
        return ComplaintResponse(**transformed_complaint)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching complaint: {str(e)}")

@router.put("/{complaint_id}/status")
async def update_complaint_status(
    complaint_id: str,
    update: ComplaintUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update complaint status (admin only)"""
    try:
        # Check if user is admin/collector
        if current_user.get("role") not in ["admin", "collector"]:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        db = get_database()
        complaints_collection = db.complaints
        
        # Find complaint
        complaint = complaints_collection.find_one({"id": complaint_id})
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        # Update fields
        update_fields = {"last_updated": datetime.utcnow()}
        status_note = ""
        
        if update.status:
            update_fields["status"] = update.status
            status_note = f"Status updated to {update.status}"
        
        if update.assigned_department:
            update_fields["assigned_department"] = update.assigned_department
            status_note += f", assigned to {update.assigned_department}"
        
        if update.admin_notes:
            status_note += f", Notes: {update.admin_notes}"
        
        # Add to status history
        if status_note:
            complaints_collection.update_one(
                {"id": complaint_id},
                {
                    "$push": {
                        "status_history": {
                            "status": update.status or complaint["status"],
                            "timestamp": datetime.utcnow(),
                            "note": status_note.strip(", "),
                            "updated_by": current_user["email"]
                        }
                    }
                }
            )
        
        # Update complaint
        result = complaints_collection.update_one(
            {"id": complaint_id},
            {"$set": update_fields}
        )
        
        if result.modified_count > 0:
            # Determine notification type based on status
            notification_type = "resolved" if update.status == "resolved" else "status_update"
            notification_title = "Complaint Resolved" if update.status == "resolved" else "Complaint Status Updated"
            
            # Create notification for user with complaint details
            await create_notification(
                user_id=complaint["user_id"],
                title=notification_title,
                message=f"Your complaint '{complaint['title']}' status has been updated: {status_note}",
                type=notification_type,
                related_complaint_id=complaint_id,
                problem_type=complaint.get("category", "general").lower().replace(" ", "_"),
                department=complaint.get("assigned_department"),
                urgency=complaint.get("urgency")
            )
            
            return {"success": True, "message": "Complaint updated successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to update complaint")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating complaint: {str(e)}")

@router.delete("/{complaint_id}")
async def delete_complaint(
    complaint_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete a complaint (user can delete own complaints)"""
    try:
        db = get_database()
        complaints_collection = db.complaints
        
        # Find complaint
        complaint = complaints_collection.find_one({"id": complaint_id})
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        # Check ownership or admin rights
        if complaint["user_id"] != current_user["user_id"] and current_user.get("role") not in ["admin", "collector"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete complaint
        result = complaints_collection.delete_one({"id": complaint_id})
        
        if result.deleted_count > 0:
            return {"success": True, "message": "Complaint deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete complaint")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting complaint: {str(e)}")

# Collector/Admin endpoints
@router.get("/collector/all", response_model=List[ComplaintResponse])
async def get_all_complaints(
    current_user: UserResponse = Depends(get_current_user),
    status: Optional[str] = None,
    category: Optional[str] = None,
    urgency: Optional[str] = None,
    sort_by: str = "priority_score"
):
    """Get all complaints for collectors/admins"""
    try:
        # Check if user is admin/collector
        if current_user.get("role") not in ["admin", "collector"]:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        db = get_database()
        complaints_collection = db.complaints
        
        # Build query
        query = {}
        if status:
            query["status"] = status
        if category:
            query["category"] = category
        if urgency:
            query["urgency"] = urgency
        
        # Sort options
        sort_options = {
            "priority_score": [("priority_score", -1)],
            "date": [("submitted_date", -1)],
            "status": [("status", 1)]
        }
        
        sort_criteria = sort_options.get(sort_by, [("priority_score", -1)])
        
        # Fetch complaints
        complaints_cursor = complaints_collection.find(query).sort(sort_criteria)
        complaints = list(complaints_cursor)
        
        # Convert to response format
        response_complaints = []
        for complaint in complaints:
            transformed_complaint = transform_complaint_for_response(complaint.copy())
            response_complaints.append(ComplaintResponse(**transformed_complaint))
        
        return response_complaints
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching complaints: {str(e)}")

async def create_notification(user_id: str, title: str, message: str, type: str):
    """Helper function to create notifications"""
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
            "timestamp": datetime.utcnow()
        }
        
        notifications_collection.insert_one(notification)
    except Exception as e:
        print(f"Error creating notification: {e}")
