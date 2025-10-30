"""Check if any complaints have uploaded documents"""
from app.db import get_database

db = get_database()

print("\n📄 Checking for Uploaded Documents:")
print("=" * 80)

# Check complaints for uploaded files
complaints_with_uploads = list(db.complaints.find({"file_path": {"$exists": True}}))
print(f"\nComplaints with file_path field: {len(complaints_with_uploads)}")

for complaint in complaints_with_uploads:
    cid = complaint.get("id") or str(complaint.get("_id"))
    file_path = complaint.get("file_path")
    filename = complaint.get("filename")
    doc_type = complaint.get("document_type")
    
    print(f"\n  Complaint ID: {cid}")
    print(f"  File Path: {file_path}")
    print(f"  Filename: {filename}")
    print(f"  Document Type in DB: {doc_type}")

# Check GridFS for uploaded files
print("\n\n📁 GridFS Files:")
print("=" * 80)

from gridfs import GridFS
fs = GridFS(db)

for file in fs.find():
    metadata = file.metadata or {}
    doc_type = metadata.get('document_type', 'unknown')
    print(f"\n  File: {file.filename}")
    print(f"  Size: {file.length} bytes")
    print(f"  Type: {doc_type}")
    print(f"  Content Type: {file.content_type}")
    print(f"  Uploaded: {file.upload_date}")
    print(f"  Metadata: {metadata}")

print("\n" + "=" * 80)
print("\n📊 Summary:")
print(f"  Total complaints with file_path: {len(complaints_with_uploads)}")
print(f"  Total files in GridFS: {fs.find().count()}")

uploaded_count = sum(1 for f in fs.find() if (f.metadata or {}).get('document_type') == 'uploaded')
generated_count = sum(1 for f in fs.find() if (f.metadata or {}).get('document_type') == 'generated')

print(f"  - Uploaded files: {uploaded_count}")
print(f"  - Generated PDFs: {generated_count}")
