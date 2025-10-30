"""Clean up old generated PDFs that have been replaced with uploaded files"""
from app.db import get_database
from gridfs import GridFS

def cleanup_gridfs():
    """Remove old generated PDFs that are no longer referenced"""
    db = get_database()
    fs = GridFS(db)
    complaints_collection = db.complaints
    
    # Get all document IDs currently referenced by complaints
    active_docs = set()
    for complaint in complaints_collection.find():
        doc_id = complaint.get("document_id")
        if doc_id:
            active_docs.add(str(doc_id))
    
    print(f"\n📊 Active documents referenced by complaints: {len(active_docs)}")
    
    # Find all documents in GridFS
    all_docs = list(fs.find())
    print(f"📁 Total documents in GridFS: {len(all_docs)}")
    
    # Find orphaned documents
    orphaned = []
    for doc in all_docs:
        doc_id = str(doc._id)
        metadata = doc.metadata or {}
        doc_type = metadata.get('document_type', 'unknown')
        
        if doc_id not in active_docs:
            orphaned.append({
                'id': doc_id,
                'filename': doc.filename,
                'type': doc_type,
                'size': doc.length
            })
    
    print(f"🗑️  Orphaned documents (not referenced): {len(orphaned)}")
    
    if orphaned:
        print("\n" + "=" * 80)
        print("Orphaned documents:")
        for i, doc in enumerate(orphaned, 1):
            print(f"  {i}. {doc['filename']} ({doc['size']} bytes) - Type: {doc['type']}")
        
        response = input(f"\nDelete {len(orphaned)} orphaned documents? (yes/no): ")
        if response.lower() in ['yes', 'y']:
            for doc in orphaned:
                fs.delete(doc['id'])
                print(f"   ✅ Deleted: {doc['filename']}")
            print(f"\n✅ Deleted {len(orphaned)} orphaned documents")
        else:
            print("❌ Cancelled")
    else:
        print("\n✅ No orphaned documents to clean up!")
    
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

if __name__ == "__main__":
    cleanup_gridfs()
