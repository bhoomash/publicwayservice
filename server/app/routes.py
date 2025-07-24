from fastapi import APIRouter, HTTPException
from .models import Complaint
from .db import complaints_collection
from bson.objectid import ObjectId
from app.db import db

router = APIRouter()

@router.get("/test-db")
def test_db():
    try:
        collections = db.list_collection_names()
        return {"status": "Connected to MongoDB ✅", "collections": collections}
    except Exception as e:
        return {"status": "Failed to connect to MongoDB ❌", "error": str(e)}
    
@router.post("/submit")
def submit_complaint(complaint: Complaint):
    result = complaints_collection.insert_one(complaint.dict())
    return {"message": "Complaint submitted", "id": str(result.inserted_id)}

@router.get("/status/{id}")
def get_status(id: str):
    complaint = complaints_collection.find_one({"_id": ObjectId(id)})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return {"status": complaint.get("status", "unknown")}
