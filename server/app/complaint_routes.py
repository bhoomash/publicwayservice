from __future__ import annotations

import uuid
from datetime import datetime, date
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, ValidationError

from .ai_service import AIService
from .auth_utils import get_current_user
from .db import get_database
from .models import AttachmentMeta, ComplaintCreate, ComplaintInDB, ComplaintResponse
from .notification_routes import create_notification
from .rag_modules.pipeline import RAGPipeline
from .utils.document_storage import get_document_storage
from .utils.pdf_generator import generate_complaint_document

router = APIRouter(prefix="/complaints", tags=["complaints"])

ATTACHMENT_ROOT = Path(__file__).resolve().parent.parent / "uploads" / "complaints"
ATTACHMENT_ROOT.mkdir(parents=True, exist_ok=True)


class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    assigned_department: Optional[str] = None
    admin_notes: Optional[str] = None


ai_service = AIService()
rag_pipeline = RAGPipeline()


def _sanitize_filename(filename: str) -> str:
    allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_."
    sanitized = "".join(char if char in allowed else "_" for char in filename)
    return sanitized or f"file_{uuid.uuid4().hex}"


def _ensure_datetime(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time())
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return None
    return None


def transform_complaint_for_response(complaint_doc: Dict[str, Any]) -> Dict[str, Any]:
    document = dict(complaint_doc)

    if "_id" in document:
        document["mongo_id"] = document["_id"]
        document.setdefault("id", str(document["_id"]))
        del document["_id"]

    document.setdefault("user_name", "")
    document.setdefault("user_email", "")
    document.setdefault("category", "general")
    document.setdefault("location", "")
    document.setdefault("contact_phone", "")
    document.setdefault("contact_email", "")
    document.setdefault("urgency", "medium")
    document.setdefault("priority", "medium")
    document.setdefault("status", "pending")
    document.setdefault("priority_score", 50)
    document.setdefault("assigned_department", "")
    document.setdefault("ai_response", "")
    document.setdefault("ai_category", "")
    document.setdefault("ai_department", "")
    document.setdefault("estimated_resolution", "")
    document.setdefault("attachments", [])

    # Normalize urgency to lowercase
    if document.get("urgency"):
        document["urgency"] = document["urgency"].lower()

    document["submitted_date"] = _ensure_datetime(
        document.get("submitted_date") or document.get("created_at")
    )
    document["last_updated"] = _ensure_datetime(
        document.get("last_updated") or document.get("updated_at")
    )
    document["date_occurred"] = _ensure_datetime(document.get("date_occurred"))

    attachments = []
    for attachment in document.get("attachments", []):
        if isinstance(attachment, dict):
            attachments.append(attachment)
        elif isinstance(attachment, AttachmentMeta):
            attachments.append(attachment.dict())
    document["attachments"] = attachments

    # Ensure rag_metadata is properly typed
    if document.get("rag_metadata") and isinstance(document["rag_metadata"], dict):
        # Convert any non-string values in metadata to strings where needed
        metadata = document["rag_metadata"]
        # Keep rag_text_length as int at top level, not in metadata
        if "text_length" in metadata and isinstance(metadata["text_length"], int):
            document["rag_text_length"] = metadata["text_length"]
            # Remove from metadata to avoid type conflicts
            metadata = {k: v for k, v in metadata.items() if k != "text_length"}
            document["rag_metadata"] = metadata

    return document


async def _store_attachments(complaint_id: str, uploads: Optional[List[UploadFile]]) -> List[Dict[str, Any]]:
    if not uploads:
        return []

    complaint_dir = ATTACHMENT_ROOT / complaint_id
    complaint_dir.mkdir(parents=True, exist_ok=True)

    stored: List[Dict[str, Any]] = []
    for upload in uploads:
        if not upload.filename:
            continue

        safe_name = _sanitize_filename(upload.filename)
        destination = complaint_dir / safe_name
        data = await upload.read()
        await upload.seek(0)
        destination.write_bytes(data)

        stored.append(
            {
                "filename": safe_name,
                "content_type": upload.content_type,
                "path": str(Path("uploads") / "complaints" / complaint_id / safe_name),
                "size": len(data),
            }
        )

    return stored


@router.post("/new", response_model=dict)
async def submit_complaint(
    title: str = Form(...),
    description: str = Form(...),
    category: Optional[str] = Form(None),
    location: str = Form(...),
    urgency: str = Form("medium"),
    date_occurred: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    attachments: Optional[List[UploadFile]] = File(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    try:
        occurrence_date: Optional[date] = None
        if date_occurred:
            try:
                occurrence_date = datetime.strptime(date_occurred, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(status_code=422, detail="Invalid date format for date_occurred. Use YYYY-MM-DD.")

        contact_email = email or current_user.get("email")
        contact_phone = phone or current_user.get("phone")

        try:
            complaint_payload = ComplaintCreate(
                title=title,
                description=description,
                category=category,
                location=location,
                urgency=urgency,
                date_occurred=occurrence_date,
                contact_email=contact_email,
                contact_phone=contact_phone,
            )
        except ValidationError as validation_error:
            raise HTTPException(status_code=422, detail=validation_error.errors())

        db = get_database()
        complaints_collection = db.complaints

        complaint_id = f"CMP{uuid.uuid4().hex[:6].upper()}"
        submitted_time = datetime.utcnow()
        status_value = "pending"

        priority_map = {
            "urgent": "high",
            "high": "high",
            "medium": "medium",
            "low": "low",
        }
        urgency_lower = (complaint_payload.urgency or "medium").lower()
        priority_value = priority_map.get(urgency_lower, "medium")

        try:
            rag_result = rag_pipeline.process_text_complaint(
                title=complaint_payload.title,
                description=complaint_payload.description,
                metadata={
                    "complaint_id": complaint_id,
                    "user_id": current_user["user_id"],
                    "user_email": current_user["email"],
                    "category_input": complaint_payload.category,
                    "urgency_input": complaint_payload.urgency,
                    "location_input": complaint_payload.location,
                },
            )
        except Exception as rag_error:
            raise HTTPException(status_code=500, detail=f"RAG processing failed: {rag_error}")

        if not rag_result.get("is_relevant", True):
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Your submission doesn't appear to describe a civic complaint that the government portal can address.",
                    "reason": rag_result.get("relevance_reason", "No justification provided"),
                    "confidence": rag_result.get("relevance_confidence", 0.0),
                    "category": rag_result.get("relevance_category", "unknown"),
                    "summary": rag_result.get("summary", ""),
                },
            )

        ai_analysis = await ai_service.analyze_complaint(
            title=complaint_payload.title,
            description=complaint_payload.description,
            urgency=complaint_payload.urgency,
            location=complaint_payload.location,
        )

        stored_attachments = await _store_attachments(complaint_id, attachments)

        complaint_document = ComplaintInDB(
            id=complaint_id,
            user_id=current_user["user_id"],
            user_name=current_user.get("full_name"),
            user_email=current_user.get("email"),
            title=complaint_payload.title,
            description=complaint_payload.description,
            category=rag_result.get("department") or ai_analysis["category"],
            location=complaint_payload.location,
            contact_phone=complaint_payload.contact_phone,
            contact_email=complaint_payload.contact_email,
            urgency=complaint_payload.urgency,
            status=status_value,
            priority=priority_value,
            priority_score=ai_analysis["priority_score"],
            assigned_department=ai_analysis["assigned_department"],
            ai_response=ai_analysis["suggested_response"],
            ai_category=ai_analysis["category"],
            ai_department=ai_analysis["assigned_department"],
            estimated_resolution=ai_analysis["estimated_resolution"],
            submitted_date=submitted_time,
            last_updated=submitted_time,
            created_at=submitted_time,
            updated_at=submitted_time,
            date_occurred=occurrence_date,
            attachments=[AttachmentMeta(**item) for item in stored_attachments],
            vector_db_id=rag_result.get("document_id"),
            rag_summary=rag_result.get("summary"),
            rag_department=rag_result.get("department"),
            rag_urgency=rag_result.get("urgency"),
            rag_location=rag_result.get("location"),
            rag_color=rag_result.get("color"),
            rag_emoji=rag_result.get("emoji"),
            rag_text_length=rag_result.get("text_length"),
            rag_metadata=rag_result.get("metadata", {}),
            status_history=[
                {
                    "status": status_value,
                    "timestamp": submitted_time,
                    "note": "Complaint submitted, processed by RAG and AI analysis",
                }
            ],
        )

        result = complaints_collection.insert_one(complaint_document.dict())

        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to submit complaint")

        # Generate and store PDF document for the complaint
        try:
            doc_storage = get_document_storage(db)
            
            # Determine if user uploaded a document or filled form
            has_uploaded_file = bool(attachments and len(attachments) > 0)
            
            if has_uploaded_file:
                # Store the first uploaded file as the main document
                first_attachment = attachments[0]
                file_data = await first_attachment.read()
                await first_attachment.seek(0)
                
                document_id = doc_storage.store_document(
                    file_data=file_data,
                    filename=first_attachment.filename or "complaint_document",
                    content_type=first_attachment.content_type or "application/octet-stream",
                    metadata={
                        "complaint_id": complaint_id,
                        "user_id": current_user["user_id"],
                        "document_type": "uploaded"
                    }
                )
                
                # Update complaint with document reference
                complaints_collection.update_one(
                    {"id": complaint_id},
                    {"$set": {
                        "document_id": str(document_id),
                        "document_type": "uploaded",
                        "filename": first_attachment.filename
                    }}
                )
                print(f"✅ Stored uploaded document for complaint {complaint_id}: {document_id}")
            else:
                # Generate PDF from form data
                complaint_data = complaint_document.dict()
                pdf_bytes = generate_complaint_document(complaint_data)
                
                document_id = doc_storage.store_document(
                    file_data=pdf_bytes,
                    filename=f"complaint_{complaint_id}.pdf",
                    content_type="application/pdf",
                    metadata={
                        "complaint_id": complaint_id,
                        "user_id": current_user["user_id"],
                        "document_type": "generated"
                    }
                )
                
                # Update complaint with document reference
                complaints_collection.update_one(
                    {"id": complaint_id},
                    {"$set": {
                        "document_id": str(document_id),
                        "document_type": "generated"
                    }}
                )
                print(f"✅ Generated and stored PDF document for complaint {complaint_id}: {document_id}")
        except Exception as doc_error:
            # Log error but don't fail the complaint submission
            print(f"❌ Error storing complaint document for {complaint_id}: {doc_error}")
            import traceback
            traceback.print_exc()

        await create_notification(
            user_id=current_user["user_id"],
            title="Complaint Submitted",
            message=f"Your complaint '{complaint_payload.title}' has been submitted and processed by the RAG intelligence pipeline.",
            type="submitted",
            related_complaint_id=complaint_id,
            problem_type=(rag_result.get("department") or "general").lower().replace(" ", "_"),
            department=rag_result.get("department"),
            urgency=complaint_payload.urgency,
        )

        return {
            "success": True,
            "complaint_id": complaint_id,
            "id": complaint_id,
            "vector_db_id": rag_result.get("document_id"),
            "rag_analysis": {
                "document_id": rag_result.get("document_id"),
                "summary": rag_result.get("summary"),
                "urgency": rag_result.get("urgency"),
                "department": rag_result.get("department"),
                "location": rag_result.get("location"),
                "color": rag_result.get("color"),
                "emoji": rag_result.get("emoji"),
                "text_length": rag_result.get("text_length"),
            },
            "ai_summary": {
                "category": ai_analysis["category"],
                "priority_score": ai_analysis["priority_score"],
                "assigned_department": ai_analysis["assigned_department"],
                "suggested_response": ai_analysis["suggested_response"],
                "estimated_resolution": ai_analysis["estimated_resolution"],
            },
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error submitting complaint: {exc}")

@router.get("/my-complaints", response_model=List[ComplaintResponse])
async def get_my_complaints(
    current_user: Dict[str, Any] = Depends(get_current_user),
    status: Optional[str] = None,
    category: Optional[str] = None,
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
        complaints_cursor = complaints_collection.find(query).sort([("submitted_date", -1), ("created_at", -1)])
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
    current_user: Dict[str, Any] = Depends(get_current_user),
    status: Optional[str] = None,
    category: Optional[str] = None,
    limit: Optional[int] = None,
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
        complaints_cursor = complaints_collection.find(query).sort([("submitted_date", -1), ("created_at", -1)])
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
    current_user: Dict[str, Any] = Depends(get_current_user),
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

@router.get("/{complaint_id}/document")
async def get_complaint_document(
    complaint_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Get the stored document (uploaded or generated PDF) for a complaint"""
    from fastapi.responses import Response
    from bson import ObjectId
    
    try:
        db = get_database()
        complaints_collection = db.complaints
        
        # Try to find complaint by both id and _id fields
        complaint = complaints_collection.find_one({"id": complaint_id})
        if not complaint:
            # Try finding by MongoDB _id if complaint_id looks like an ObjectId
            try:
                if ObjectId.is_valid(complaint_id):
                    complaint = complaints_collection.find_one({"_id": ObjectId(complaint_id)})
            except:
                pass
        
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        # Check permissions - users can view their own, admins can view all
        if current_user.get("role") not in ["admin", "collector"] and complaint.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if document exists
        document_id = complaint.get("document_id")
        if not document_id:
            raise HTTPException(status_code=404, detail="No document stored for this complaint")
        
        # Retrieve document from GridFS
        doc_storage = get_document_storage(db)
        document = doc_storage.get_document(document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found in storage")
        
        # Return document with appropriate headers
        return Response(
            content=document["data"],
            media_type=document["content_type"],
            headers={
                "Content-Disposition": f'inline; filename="{document["filename"]}"',
                "Cache-Control": "no-cache"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving document: {str(e)}")

@router.put("/{complaint_id}/status")
async def update_complaint_status(
    complaint_id: str,
    update: ComplaintUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
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
    current_user: Dict[str, Any] = Depends(get_current_user),
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
    current_user: Dict[str, Any] = Depends(get_current_user),
    status: Optional[str] = None,
    category: Optional[str] = None,
    urgency: Optional[str] = None,
    sort_by: str = "priority_score",
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
            "date": [("submitted_date", -1), ("created_at", -1)],
            "status": [("status", 1)],
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

@router.get("/user-dashboard-stats")
async def get_user_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get dashboard statistics for the logged-in user"""
    try:
        db = get_database()
        complaints_collection = db.complaints
        user_id = current_user["user_id"]
        
        # Total complaints by user
        total_complaints = complaints_collection.count_documents({"user_id": user_id})
        
        # Status counts
        status_regex = lambda value: {"$regex": f"^{value}$", "$options": "i"}
        pending = complaints_collection.count_documents({"user_id": user_id, "status": status_regex("pending")})
        in_progress = complaints_collection.count_documents({"user_id": user_id, "status": status_regex("in_progress")})
        resolved = complaints_collection.count_documents({"user_id": user_id, "status": status_regex("resolved")})
        rejected = complaints_collection.count_documents({"user_id": user_id, "status": status_regex("rejected")})
        
        # Recent complaints (last 5)
        recent_complaints = list(complaints_collection.find(
            {"user_id": user_id}
        ).sort("submitted_date", -1).limit(5))
        
        # Transform for response
        recent = []
        for complaint in recent_complaints:
            recent.append({
                "id": str(complaint.get("_id")),
                "title": complaint.get("title", ""),
                "status": complaint.get("status", "pending"),
                "category": complaint.get("category", "general"),
                "submitted_date": complaint.get("submitted_date"),
                "urgency": complaint.get("urgency", "medium")
            })
        
        return {
            "total_complaints": total_complaints,
            "pending": pending,
            "in_progress": in_progress,
            "resolved": resolved,
            "rejected": rejected,
            "recent_complaints": recent
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching user dashboard stats: {str(e)}"
        )
