"""
RAG (Retrieval-Augmented Generation) Routes for Government Portal
Handles document upload, processing, and semantic search for complaints
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import os
import shutil
import logging
from datetime import datetime

from app.rag_modules.pipeline import RAGPipeline
from app.auth_utils import get_current_user
from app.db import complaints_collection
from app.models import User

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/rag", tags=["RAG"])


def get_user_value(user: Any, primary_key: str, fallback_keys: Optional[List[str]] = None, default: Any = None) -> Any:
    """Helper to safely extract attributes from either dict or object-based users."""
    keys_to_check = [primary_key]
    if fallback_keys:
        keys_to_check.extend(fallback_keys)

    if isinstance(user, dict):
        for key in keys_to_check:
            if key in user and user[key] is not None:
                return user[key]
        return default

    for key in keys_to_check:
        value = getattr(user, key, None)
        if value is not None:
            return value
    return default

# Initialize RAG Pipeline
rag_pipeline = RAGPipeline()

# Upload directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.doc', '.txt', '.png', '.jpg', '.jpeg'}


# Pydantic Models
class SearchRequest(BaseModel):
    query: str
    n_results: int = 5
    department_filter: Optional[str] = None
    urgency_filter: Optional[str] = None


class ComplaintTextRequest(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    urgency: Optional[str] = None
    location: Optional[str] = None


# Helper Functions
def get_file_extension(filename: str) -> str:
    """Get file extension from filename"""
    return os.path.splitext(filename)[1].lower()


def is_allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return get_file_extension(filename) in ALLOWED_EXTENSIONS


# Routes
@router.post("/upload", response_model=Dict[str, Any])
async def upload_complaint_document(
    file: UploadFile = File(...),
    current_user: Any = Depends(get_current_user)
):
    """
    Upload a complaint document (PDF, DOCX, Image) for RAG processing
    Extracts text, classifies with AI, and stores in vector database
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        if not is_allowed_file(file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Create unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        user_email = get_user_value(current_user, "email", ["user_email"])
        user_id = get_user_value(current_user, "user_id", ["id", "_id"])

        logger.info(f"File uploaded: {safe_filename} by user {user_email or 'unknown user'}")
        
        # Process through RAG pipeline
        try:
            logger.info(f"Starting RAG processing for: {safe_filename}")
            rag_result = rag_pipeline.process_uploaded_file(file_path, safe_filename)
            logger.info(f"RAG processing completed successfully")
        except Exception as rag_error:
            logger.error(f"RAG pipeline error: {str(rag_error)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"RAG processing failed: {str(rag_error)}")

        if not rag_result.get("is_relevant", True):
            try:
                os.remove(file_path)
            except OSError:
                logger.warning("Failed to remove non-relevant upload: %s", file_path)
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "The uploaded document doesn't appear to describe a civic complaint.",
                    "reason": rag_result.get("relevance_reason", "No justification provided"),
                    "confidence": rag_result.get("relevance_confidence", 0.0),
                    "category": rag_result.get("relevance_category", "unknown"),
                    "summary": rag_result.get("summary", "")
                }
            )
        
        # Save to MongoDB for complaint tracking
        complaint_data = {
            "user_id": str(user_id) if user_id is not None else None,
            "user_email": user_email,
            "title": rag_result["summary"][:100],  # First 100 chars as title
            "description": rag_result["summary"],
            "category": rag_result["department"],
            "priority": rag_result["urgency"],
            "urgency": rag_result["urgency"],
            "status": "Pending",
            "location": rag_result.get("location", "Not specified"),
            "file_path": file_path,
            "filename": safe_filename,
            "vector_db_id": rag_result["document_id"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "ai_processed": True,
            "rag_metadata": {
                "color": rag_result["color"],
                "emoji": rag_result["emoji"],
                "text_length": rag_result["text_length"]
            }
        }
        
        # Insert into MongoDB
        result = complaints_collection.insert_one(complaint_data)
        complaint_data["_id"] = str(result.inserted_id)
        
        logger.info(f"Complaint created from file: {complaint_data['_id']}")
        
        return {
            "success": True,
            "message": "Document processed successfully",
            "complaint_id": complaint_data["_id"],
            "vector_db_id": rag_result["document_id"],
            "summary": rag_result["summary"],
            "urgency": rag_result["urgency"],
            "department": rag_result["department"],
            "location": rag_result["location"],
            "color": rag_result["color"],
            "emoji": rag_result["emoji"]
        }
        
    except Exception as e:
        logger.error(f"Error processing uploaded file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")


@router.post("/search", response_model=List[Dict[str, Any]])
async def search_similar_complaints(
    search_request: SearchRequest,
    current_user: Any = Depends(get_current_user)
):
    """
    Search for similar complaints using semantic search (RAG)
    Returns complaints similar to the query text
    """
    try:
        results = rag_pipeline.search_similar_complaints(
            query=search_request.query,
            n_results=search_request.n_results,
            department_filter=search_request.department_filter,
            urgency_filter=search_request.urgency_filter
        )
        
        user_email = get_user_value(current_user, "email", ["user_email"])
        logger.info(f"Search performed by {user_email or 'unknown user'}, found {len(results)} results")
        return results
        
    except Exception as e:
        logger.error(f"Error searching complaints: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/complaint/{document_id}", response_model=Dict[str, Any])
async def get_complaint_details(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information about a specific complaint from vector database
    """
    try:
        result = rag_pipeline.get_complaint_details(document_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching complaint details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch complaint: {str(e)}")


@router.get("/stats", response_model=Dict[str, Any])
async def get_rag_statistics(
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics from RAG vector database
    Includes department distribution, urgency levels, and total complaints
    """
    try:
        stats = rag_pipeline.get_dashboard_stats()
        return stats
        
    except Exception as e:
        logger.error(f"Error fetching RAG stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch statistics: {str(e)}")


@router.post("/analyze-text", response_model=Dict[str, Any])
async def analyze_complaint_text(
    request: ComplaintTextRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Analyze complaint text and find similar past complaints
    Useful for showing similar complaints before submission
    """
    try:
        # Combine title and description for search
        full_text = f"{request.title} {request.description}"
        
        # Search for similar complaints
        similar_complaints = rag_pipeline.search_similar_complaints(
            query=full_text,
            n_results=5,
            department_filter=request.category,
            urgency_filter=request.urgency
        )
        
        return {
            "similar_complaints": similar_complaints,
            "count": len(similar_complaints),
            "query": request.title
        }
        
    except Exception as e:
        logger.error(f"Error analyzing text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Text analysis failed: {str(e)}")


@router.post("/add-to-vector-db", response_model=Dict[str, Any])
async def add_complaint_to_vector_db(
    complaint_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Add an existing text-based complaint to the vector database
    Used to backfill existing complaints into RAG system
    """
    try:
        # Fetch complaint from MongoDB
        complaint = complaints_collection.find_one({"_id": complaint_id})
        
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        # Prepare text and metadata
        text = f"{complaint.get('title', '')} {complaint.get('description', '')}"
        metadata = {
            "filename": f"complaint_{complaint_id}.txt",
            "upload_date": complaint.get('created_at', datetime.utcnow()).isoformat(),
            "file_path": f"text_complaint_{complaint_id}",
            "summary": complaint.get('description', '')[:200],
            "urgency": complaint.get('urgency', 'Medium'),
            "department": complaint.get('category', 'General'),
            "location": complaint.get('location', 'Not specified'),
            "color": "Blue",
            "emoji": "📝"
        }
        
        # Add to vector store
        from app.vector_store.chroma_store import ChromaVectorStore
        vector_store = ChromaVectorStore()
        doc_id = vector_store.add_document(text=text, metadata=metadata)
        
        # Update MongoDB with vector_db_id
        complaints_collection.update_one(
            {"_id": complaint_id},
            {"$set": {"vector_db_id": doc_id}}
        )
        
        logger.info(f"Added complaint {complaint_id} to vector DB with ID: {doc_id}")
        
        return {
            "success": True,
            "complaint_id": complaint_id,
            "vector_db_id": doc_id,
            "message": "Complaint added to vector database"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding to vector DB: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add to vector database: {str(e)}")


@router.get("/health")
async def rag_health_check():
    """
    Health check endpoint for RAG service
    """
    try:
        # Test vector store connection
        stats = rag_pipeline.get_dashboard_stats()
        
        return {
            "status": "healthy",
            "service": "RAG Pipeline",
            "vector_db": "connected",
            "total_documents": stats.get("total_complaints", 0),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "RAG Pipeline",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


# Public endpoints for citizen complaint form (no auth required)
class PublicAnalyzeRequest(BaseModel):
    text: str
    max_results: int = 5


@router.post("/public/analyze-text", response_model=Dict[str, Any])
async def public_analyze_text(request: PublicAnalyzeRequest):
    """
    Public endpoint to analyze complaint text and find similar complaints
    Used by citizens while filling out complaint forms (no authentication required)
    """
    try:
        if not request.text or len(request.text.strip()) < 10:
            return {
                "similar_complaints": [],
                "suggestions": ["Please provide more details about your complaint for better analysis"],
                "count": 0
            }
        
        # Search for similar complaints
        similar_complaints = rag_pipeline.search_similar_complaints(
            query=request.text,
            n_results=request.max_results
        )
        
        # Generate AI suggestions based on the text
        suggestions = []
        if len(request.text) < 50:
            suggestions.append("Consider adding more details about the issue")
        if "urgent" in request.text.lower() or "emergency" in request.text.lower():
            suggestions.append("This appears to be urgent - please select high/urgent priority")
        if not any(word in request.text.lower() for word in ["street", "address", "location", "area"]):
            suggestions.append("Adding specific location details will help with faster resolution")
        
        return {
            "similar_complaints": similar_complaints,
            "suggestions": suggestions if suggestions else ["Your complaint description looks good"],
            "count": len(similar_complaints)
        }
        
    except Exception as e:
        logger.error(f"Error in public text analysis: {str(e)}")
        return {
            "similar_complaints": [],
            "suggestions": ["Unable to analyze at this time. Please proceed with your complaint."],
            "count": 0,
            "error": str(e)
        }


class PublicComplaintData(BaseModel):
    id: str
    title: str
    description: str
    category: str
    location: str
    status: str = "pending"


@router.post("/public/add-to-vector-db", response_model=Dict[str, Any])
async def public_add_to_vector_db(complaint: PublicComplaintData):
    """
    Public endpoint to add a complaint to the vector database
    Used after citizen submits a complaint (no authentication required for simplicity)
    In production, this should require authentication
    """
    try:
        # Fetch complaint from database if it exists
        # For now, use the provided data directly
        
        # Add to vector database
        success = rag_pipeline.add_complaint_to_vector_db(
            complaint_id=complaint.id,
            title=complaint.title,
            description=complaint.description,
            category=complaint.category,
            location=complaint.location,
            status=complaint.status,
            metadata={
                "category": complaint.category,
                "location": complaint.location,
                "status": complaint.status
            }
        )
        
        if success:
            return {
                "status": "success",
                "message": "Complaint added to vector database",
                "complaint_id": complaint.id
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to add complaint to vector database")
            
    except Exception as e:
        logger.error(f"Error adding complaint to vector DB: {str(e)}")
        # Don't fail the whole request if RAG fails
        return {
            "status": "partial_success",
            "message": "Complaint submitted but vector database update failed",
            "error": str(e)
        }
