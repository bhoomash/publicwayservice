from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from .models import User
from .auth_utils import get_current_user
from .ai_service import AIService
from .db import get_database
import uuid

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    id: str
    user_message: str
    ai_response: str
    timestamp: datetime
    has_complaint_form: Optional[bool] = False
    complaint_form_data: Optional[dict] = None

class GuidedComplaintData(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    urgency: Optional[str] = None
    step: str = "title"  # Current collection step

class ComplaintSubmissionRequest(BaseModel):
    complaint_data: dict

# Initialize AI service
ai_service = AIService()

@router.post("/message", response_model=ChatResponse)
async def send_chat_message(
    message: ChatMessage,
    current_user: User = Depends(get_current_user)
):
    """Send message to AI assistant with enhanced complaint detection"""
    try:
        # Get user context (recent complaints, etc.)
        db = get_database()
        complaints_collection = db.complaints
        
        # Get user's recent complaints for context
        recent_complaints = list(complaints_collection.find(
            {"user_id": current_user["user_id"]}
        ).sort("submitted_date", -1).limit(5))
        
        user_context = {
            "user_id": current_user["user_id"],
            "user_name": current_user.get("full_name"),
            "recent_complaints": recent_complaints
        }
        
        # Check if this looks like a complaint description
        complaint_keywords = [
            "problem", "issue", "broken", "not working", "damaged", "complaint",
            "road", "water", "electricity", "garbage", "pollution", "noise",
            "pothole", "streetlight", "drainage", "sewage", "corruption"
        ]
        
        message_lower = message.message.lower()
        seems_like_complaint = any(keyword in message_lower for keyword in complaint_keywords)
        
        # Generate AI response
        ai_response = await ai_service.generate_chat_response(
            message.message,
            user_context
        )
        
        # If it seems like a complaint, offer guided submission
        has_complaint_form = False
        complaint_form_data = None
        
        if seems_like_complaint and len(message.message.split()) > 5:  # Substantial message
            has_complaint_form = True
            ai_response += "\n\n🚀 **Quick Action**: I can help you submit this as an official complaint right now! Would you like me to guide you through the process step by step?"
            
            # Pre-populate some data if possible
            complaint_form_data = {
                "detected_description": message.message,
                "suggested_category": _detect_category(message.message),
                "step": "confirm"
            }
        
        # Save chat history
        chat_collection = db.chat_history
        chat_id = str(uuid.uuid4())
        
        chat_record = {
            "id": chat_id,
            "user_id": current_user["user_id"],
            "user_message": message.message,
            "ai_response": ai_response,
            "timestamp": datetime.utcnow(),
            "has_complaint_form": has_complaint_form,
            "complaint_form_data": complaint_form_data
        }
        
        chat_collection.insert_one(chat_record)
        
        return ChatResponse(**chat_record)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat message: {str(e)}")

def _detect_category(message: str) -> str:
    """Detect likely complaint category from message content"""
    message_lower = message.lower()
    
    category_keywords = {
        "Infrastructure": ["road", "bridge", "building", "construction", "pothole", "streetlight", "sidewalk"],
        "Water & Sanitation": ["water", "sewage", "drainage", "toilet", "plumbing", "leak"],
        "Electricity": ["power", "electricity", "outage", "transformer", "wire"],
        "Environment": ["pollution", "garbage", "waste", "noise", "air", "smell"],
        "Transportation": ["bus", "traffic", "parking", "signal", "transport"],
        "Public Safety": ["crime", "safety", "police", "emergency", "accident"],
        "Healthcare": ["hospital", "clinic", "medical", "health", "doctor"],
        "Education": ["school", "college", "teacher", "education"],
        "Corruption": ["bribe", "corruption", "illegal", "fraud"]
    }
    
    for category, keywords in category_keywords.items():
        if any(keyword in message_lower for keyword in keywords):
            return category
    
    return "Other"

@router.post("/submit-guided-complaint")
async def submit_guided_complaint(
    request: ComplaintSubmissionRequest,
    current_user: User = Depends(get_current_user)
):
    """Submit complaint collected through guided chat process"""
    try:
        from .complaint_routes import ComplaintCreate
        from .ai_service import AIService
        from .rag_modules.pipeline import RAGPipeline
        
        complaint_data = request.complaint_data
        
        # Validate required fields
        required_fields = ["title", "description", "category", "location", "urgency"]
        for field in required_fields:
            if not complaint_data.get(field):
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Create complaint using existing logic
        db = get_database()
        complaints_collection = db.complaints
        
        # Generate complaint ID
        complaint_id = f"CMP{uuid.uuid4().hex[:6].upper()}"
        submitted_time = datetime.utcnow()
        
        # Process through RAG pipeline
        rag_pipeline = RAGPipeline()
        rag_result = rag_pipeline.process_text_complaint(
            title=complaint_data["title"],
            description=complaint_data["description"],
            metadata={
                "complaint_id": complaint_id,
                "user_id": current_user["user_id"],
                "user_email": current_user["email"],
                "source": "chat_guided",
                "category_input": complaint_data["category"],
                "urgency_input": complaint_data["urgency"],
                "location_input": complaint_data["location"]
            }
        )
        
        # AI Processing
        ai_service = AIService()
        ai_analysis = await ai_service.analyze_complaint(
            title=complaint_data["title"],
            description=complaint_data["description"],
            urgency=complaint_data["urgency"],
            location=complaint_data["location"]
        )
        
        priority_map = {"low": "low", "medium": "medium", "high": "high", "critical": "high"}
        priority_value = priority_map.get(complaint_data["urgency"].lower(), "medium")
        
        # Create complaint document
        complaint_doc = {
            "id": complaint_id,
            "user_id": current_user["user_id"],
            "user_name": current_user["full_name"],
            "user_email": current_user["email"],
            "title": complaint_data["title"],
            "description": complaint_data["description"],
            "category": rag_result.get("department") or ai_analysis["category"],
            "location": complaint_data["location"],
            "contact_phone": current_user.get("phone", ""),
            "contact_email": current_user["email"],
            "urgency": complaint_data["urgency"],
            "status": "pending",
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
            "source": "chat_guided",
            "status_history": [
                {
                    "status": "pending",
                    "timestamp": submitted_time,
                    "updated_by": "system"
                }
            ]
        }
        
        # Insert into database
        result = complaints_collection.insert_one(complaint_doc)
        
        if result.inserted_id:
            return {
                "success": True,
                "message": "Complaint submitted successfully through chat!",
                "complaint_id": complaint_id,
                "ai_analysis": ai_analysis,
                "rag_analysis": {
                    "summary": rag_result["summary"],
                    "department": rag_result["department"],
                    "urgency": rag_result["urgency"]
                }
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to submit complaint")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting guided complaint: {str(e)}")

@router.get("/history", response_model=List[ChatResponse])
async def get_chat_history(
    current_user: User = Depends(get_current_user),
    limit: int = 20
):
    """Get user's chat history"""
    try:
        db = get_database()
        chat_collection = db.chat_history
        
        # Fetch chat history
        chat_cursor = chat_collection.find(
            {"user_id": current_user["user_id"]}
        ).sort("timestamp", -1).limit(limit)
        
        chat_history = list(chat_cursor)
        
        # Convert to response format
        response_history = []
        for chat in chat_history:
            response_history.append(ChatResponse(**chat))
        
        return list(reversed(response_history))  # Return in chronological order
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching chat history: {str(e)}")

@router.delete("/history")
async def clear_chat_history(current_user: User = Depends(get_current_user)):
    """Clear user's chat history"""
    try:
        db = get_database()
        chat_collection = db.chat_history
        
        result = chat_collection.delete_many({"user_id": current_user["user_id"]})
        
        return {
            "success": True,
            "message": f"Cleared {result.deleted_count} chat messages"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing chat history: {str(e)}")

@router.get("/quick-responses")
async def get_quick_responses():
    """Get predefined quick response options"""
    return {
        "quick_responses": [
            "What's the status of my complaint?",
            "How long does it take to resolve complaints?",
            "How do I submit a new complaint?",
            "Which department handles my type of issue?",
            "Can I update my complaint details?",
            "How do I contact support?",
            "What documents should I attach?",
            "How is priority determined?"
        ]
    }
