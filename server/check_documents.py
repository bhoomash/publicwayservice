"""Check which complaints have documents stored"""
from app.db import get_database

db = get_database()
complaints = db.complaints

# Get all complaints
all_complaints = list(complaints.find({}, {"id": 1, "_id": 1, "document_id": 1, "document_type": 1, "message": 1}))

print(f"\n📊 Total complaints: {len(all_complaints)}")
print("=" * 80)

complaints_with_docs = 0
complaints_without_docs = 0

for complaint in all_complaints:
    complaint_id = complaint.get("id") or str(complaint.get("_id"))
    doc_id = complaint.get("document_id")
    doc_type = complaint.get("document_type")
    message = complaint.get("message", "")[:50]
    
    if doc_id:
        complaints_with_docs += 1
        print(f"✅ ID: {complaint_id}")
        print(f"   Document ID: {doc_id}")
        print(f"   Type: {doc_type}")
        print(f"   Message: {message}...")
        print()
    else:
        complaints_without_docs += 1
        print(f"❌ ID: {complaint_id}")
        print(f"   No document stored")
        print(f"   Message: {message}...")
        print()

print("=" * 80)
print(f"✅ Complaints WITH documents: {complaints_with_docs}")
print(f"❌ Complaints WITHOUT documents: {complaints_without_docs}")
print()

# Check GridFS
print("\n📁 Checking GridFS...")
print("=" * 80)
try:
    from gridfs import GridFS
    fs = GridFS(db)
    all_files = list(fs.find())
    print(f"Total files in GridFS: {len(all_files)}")
    for file in all_files[:10]:  # Show first 10
        print(f"  - {file.filename} ({file.length} bytes, uploaded: {file.upload_date})")
except Exception as e:
    print(f"Error checking GridFS: {e}")
