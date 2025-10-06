from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
import os
import shutil
import logging
from datetime import datetime

from rag.pipeline import RAGPipeline
from config import Config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Intelligent Complaint RAG System",
    description="RAG pipeline for processing and analyzing complaints/reports",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG pipeline
rag_pipeline = RAGPipeline()

# Ensure upload directory exists
os.makedirs(Config.UPLOAD_DIR, exist_ok=True)

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Intelligent Complaint RAG System API",
        "version": "1.0.0",
        "endpoints": {
            "upload": "/upload",
            "search": "/search",
            "complaint": "/complaint/{document_id}",
            "stats": "/stats"
        }
    }

@app.post("/upload")
async def upload_complaint(file: UploadFile = File(...)):
    """Upload and process a complaint document."""
    try:
        # Validate file type
        allowed_extensions = ['.pdf', '.docx', '.txt']
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(Config.UPLOAD_DIR, safe_filename)
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"Saved uploaded file: {safe_filename}")
        
        # Process through RAG pipeline
        result = rag_pipeline.process_uploaded_file(file_path, file.filename)
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "message": "Complaint processed successfully",
                "data": result
            }
        )
        
    except Exception as e:
        logger.error(f"Error processing upload: {str(e)}")
        
        # Clean up file if it was saved
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        
        raise HTTPException(
            status_code=500,
            detail=f"Error processing complaint: {str(e)}"
        )

@app.get("/search")
async def search_complaints(
    query: str = Query(..., description="Search query"),
    n_results: int = Query(5, ge=1, le=20, description="Number of results to return"),
    department: Optional[str] = Query(None, description="Filter by department"),
    urgency: Optional[str] = Query(None, description="Filter by urgency level")
):
    """Search for similar complaints."""
    try:
        results = rag_pipeline.search_similar_complaints(
            query=query,
            n_results=n_results,
            department_filter=department,
            urgency_filter=urgency
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "query": query,
                "filters": {
                    "department": department,
                    "urgency": urgency
                },
                "results_count": len(results),
                "data": results
            }
        )
        
    except Exception as e:
        logger.error(f"Error searching complaints: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error searching complaints: {str(e)}"
        )

@app.get("/complaint/{document_id}")
async def get_complaint_details(document_id: str):
    """Get detailed information about a specific complaint."""
    try:
        result = rag_pipeline.get_complaint_details(document_id)
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail="Complaint not found"
            )
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "data": result
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting complaint details: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving complaint: {str(e)}"
        )

@app.get("/stats")
async def get_dashboard_stats():
    """Get dashboard statistics."""
    try:
        stats = rag_pipeline.get_dashboard_stats()
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "data": stats
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving statistics: {str(e)}"
        )

@app.get("/departments")
async def get_departments():
    """Get list of available departments."""
    return JSONResponse(
        status_code=200,
        content={
            "status": "success",
            "data": {
                "departments": Config.DEPARTMENTS,
                "urgency_levels": list(Config.URGENCY_LEVELS.keys())
            }
        }
    )

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Test vector store connection
        stats = rag_pipeline.get_dashboard_stats()
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "components": {
                    "vector_store": "operational",
                    "llm_client": "operational",
                    "total_documents": stats.get("total_complaints", 0)
                }
            }
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "timestamp": datetime.now().isoformat(),
                "error": str(e)
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
