"""Comprehensive verification of document storage system"""
from app.db import get_database
from gridfs import GridFS
from bson import ObjectId

def verify_system():
    """Verify the complete document storage system"""
    db = get_database()
    fs = GridFS(db)
    complaints_collection = db.complaints
    
    print("\n" + "=" * 80)
    print("📋 DOCUMENT STORAGE SYSTEM VERIFICATION")
    print("=" * 80)
    
    # Count complaints
    total_complaints = complaints_collection.count_documents({})
    complaints_with_docs = complaints_collection.count_documents({"document_id": {"$exists": True}})
    
    print(f"\n📊 Complaints Summary:")
    print(f"   Total complaints: {total_complaints}")
    print(f"   Complaints with documents: {complaints_with_docs}")
    print(f"   Complaints without documents: {total_complaints - complaints_with_docs}")
    
    # Count GridFS documents
    total_gridfs_docs = db.fs.files.count_documents({})
    print(f"\n📁 GridFS Documents: {total_gridfs_docs}")
    
    # Count by document type
    uploaded = 0
    generated = 0
    unknown = 0
    
    for file in fs.find():
        metadata = file.metadata or {}
        doc_type = metadata.get('document_type', 'unknown')
        if doc_type == 'uploaded':
            uploaded += 1
        elif doc_type == 'generated':
            generated += 1
        else:
            unknown += 1
    
    print(f"\n📊 Documents by Type:")
    print(f"   ✅ Uploaded (citizen's files): {uploaded}")
    print(f"   📝 Generated (from form data): {generated}")
    print(f"   ❓ Unknown type: {unknown}")
    
    # Show complaints with uploaded documents
    print(f"\n📤 Complaints with UPLOADED documents:")
    uploaded_complaints = list(complaints_collection.find({"document_type": "uploaded"}))
    for complaint in uploaded_complaints:
        complaint_id = complaint.get("id") or str(complaint.get("_id"))
        filename = complaint.get("filename", "N/A")
        doc_id = complaint.get("document_id")
        print(f"   - {complaint_id}: {filename}")
        print(f"     Document ID: {doc_id}")
    
    # Show complaints with generated documents
    print(f"\n📝 Complaints with GENERATED documents:")
    generated_complaints = list(complaints_collection.find({"document_type": "generated"}))
    for complaint in generated_complaints:
        complaint_id = complaint.get("id") or str(complaint.get("_id"))
        title = complaint.get("title", "N/A")
        doc_id = complaint.get("document_id")
        print(f"   - {complaint_id}: {title}")
        print(f"     Document ID: {doc_id}")
    
    # Verify all documents are accessible
    print(f"\n🔍 Verifying document accessibility:")
    all_complaints = list(complaints_collection.find({"document_id": {"$exists": True}}))
    accessible = 0
    inaccessible = 0
    
    for complaint in all_complaints:
        doc_id = complaint.get("document_id")
        complaint_id = complaint.get("id") or str(complaint.get("_id"))
        
        try:
            # Convert string to ObjectId if needed
            if isinstance(doc_id, str):
                doc_id = ObjectId(doc_id)
            
            file = fs.find_one({"_id": doc_id})
            if file:
                accessible += 1
                metadata = file.metadata or {}
                doc_type = metadata.get('document_type', 'unknown')
                print(f"   ✅ {complaint_id}: Document accessible ({doc_type})")
            else:
                inaccessible += 1
                print(f"   ❌ {complaint_id}: Document NOT FOUND in GridFS")
        except Exception as e:
            inaccessible += 1
            print(f"   ❌ {complaint_id}: Error - {e}")
    
    print(f"\n📊 Accessibility Summary:")
    print(f"   ✅ Accessible: {accessible}")
    print(f"   ❌ Inaccessible: {inaccessible}")
    
    # System status
    print("\n" + "=" * 80)
    if inaccessible == 0 and total_complaints == complaints_with_docs:
        print("✅ SYSTEM STATUS: FULLY OPERATIONAL")
        print("\n✨ All complaints have accessible documents!")
        print(f"   - {uploaded} complaints have the ACTUAL uploaded files from citizens")
        print(f"   - {generated} complaints have PDFs generated from form data")
        print("\n🎯 NEW SUBMISSIONS will:")
        print("   1. If user uploads a file → Store ACTUAL file in GridFS")
        print("   2. If user fills form only → Generate PDF and store in GridFS")
        print("   3. Admin views document → Display the SAME document (uploaded or generated)")
    else:
        print("⚠️ SYSTEM STATUS: ISSUES DETECTED")
        if inaccessible > 0:
            print(f"   - {inaccessible} documents are not accessible")
        if total_complaints != complaints_with_docs:
            print(f"   - {total_complaints - complaints_with_docs} complaints have no documents")
    print("=" * 80)

if __name__ == "__main__":
    verify_system()
