"""Check recent complaints for document_id"""
from app.db import get_database

db = get_database()
complaints = list(db.complaints.find().sort('_id', -1).limit(10))

print("\n" + "=" * 80)
print("Recent Complaints")
print("=" * 80)

for i, complaint in enumerate(complaints, 1):
    complaint_id = complaint.get('id', 'N/A')
    title = complaint.get('title', 'N/A')[:50]
    doc_id = complaint.get('document_id')
    doc_type = complaint.get('document_type', 'N/A')
    has_attachments = len(complaint.get('attachments', []))
    
    print(f"\n{i}. Complaint ID: {complaint_id}")
    print(f"   Title: {title}")
    print(f"   Document ID: {doc_id}")
    print(f"   Document Type: {doc_type}")
    print(f"   Attachments: {has_attachments}")
    
    if not doc_id:
        print(f"   ⚠️  NO DOCUMENT STORED!")
