from fastapi import APIRouter, HTTPException, Depends
from typing import List
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

# Initialize AI service
ai_service = AIService()

@router.post("/message", response_model=ChatResponse)
async def send_chat_message(
    message: ChatMessage,
    current_user: User = Depends(get_current_user)
):
    """Send message to AI assistant"""
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
        
        # Generate AI response
        ai_response = await ai_service.generate_chat_response(
            message.message,
            user_context
        )
        
        # Save chat history
        chat_collection = db.chat_history
        chat_id = str(uuid.uuid4())
        
        chat_record = {
            "id": chat_id,
            "user_id": current_user["user_id"],
            "user_message": message.message,
            "ai_response": ai_response,
            "timestamp": datetime.utcnow()
        }
        
        chat_collection.insert_one(chat_record)
        
        return ChatResponse(**chat_record)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat message: {str(e)}")

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
