"""Update metadata for documents to set proper document_type"""
from app.db import get_database
from gridfs import GridFS

def update_document_metadata():
    """Update metadata for all documents in GridFS"""
    db = get_database()
    fs = GridFS(db)
    complaints_collection = db.complaints
    
    # Get all complaints and their document types
    complaint_doc_types = {}
    for complaint in complaints_collection.find():
        doc_id = complaint.get("document_id")
        doc_type = complaint.get("document_type", "generated")
        if doc_id:
            complaint_doc_types[str(doc_id)] = doc_type
    
    print(f"\n📊 Processing {len(complaint_doc_types)} documents from complaints")
    
    # Update metadata for each document in GridFS
    updated = 0
    for doc_id, doc_type in complaint_doc_types.items():
        try:
            # Get the file
            file = fs.find_one({"_id": doc_id})
            if not file:
                print(f"⚠️  Document not found in GridFS: {doc_id}")
                continue
            
            current_metadata = file.metadata or {}
            current_type = current_metadata.get('document_type', 'unknown')
            
            if current_type != doc_type:
                # Update metadata
                db.fs.files.update_one(
                    {"_id": file._id},
                    {"$set": {"metadata.document_type": doc_type}}
                )
                print(f"✅ Updated {file.filename}: {current_type} → {doc_type}")
                updated += 1
            else:
                print(f"✓ {file.filename}: already {doc_type}")
        
        except Exception as e:
            print(f"❌ Error updating {doc_id}: {e}")
    
    print(f"\n📊 Updated {updated} documents")
    
    # Show final state
    print("\n" + "=" * 80)
    print("📊 Final GridFS state:")
    
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
    
    print(f"   - Uploaded files: {uploaded}")
    print(f"   - Generated PDFs: {generated}")
    print(f"   - Unknown type: {unknown}")
    print(f"   - Total: {uploaded + generated + unknown}")
    
    print("\n✅ All documents now have proper document_type metadata!")

if __name__ == "__main__":
    update_document_metadata()
