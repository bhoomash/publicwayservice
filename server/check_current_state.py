"""Check current state of complaints and GridFS documents"""
from app.db import get_database
from gridfs import GridFS
from bson import ObjectId

def check_current_state():
    """Check complaints and GridFS documents"""
    db = get_database()
    fs = GridFS(db)
    complaints_collection = db.complaints
    
    print("\n" + "=" * 80)
    print("📋 COMPLAINTS WITH DOCUMENTS")
    print("=" * 80)
    
    for complaint in complaints_collection.find():
        complaint_id = complaint.get("id") or str(complaint.get("_id"))
        doc_id = complaint.get("document_id")
        doc_type = complaint.get("document_type", "N/A")
        filename = complaint.get("filename", "N/A")
        file_path = complaint.get("file_path", "N/A")
        
        print(f"\nComplaint: {complaint_id}")
        print(f"  Document ID: {doc_id}")
        print(f"  Document Type: {doc_type}")
        print(f"  Filename: {filename}")
        print(f"  File Path: {file_path}")
    
    print("\n" + "=" * 80)
    print("📁 GRIDFS DOCUMENTS")
    print("=" * 80)
    
    for i, file in enumerate(fs.find(), 1):
        metadata = file.metadata or {}
        print(f"\n{i}. GridFS Document")
        print(f"  ID: {file._id}")
        print(f"  Filename: {file.filename}")
        print(f"  Size: {file.length} bytes")
        print(f"  Content Type: {file.content_type}")
        print(f"  Upload Date: {file.upload_date}")
        print(f"  Metadata:")
        for key, value in metadata.items():
            print(f"    - {key}: {value}")

if __name__ == "__main__":
    check_current_state()
