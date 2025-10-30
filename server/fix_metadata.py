"""Add document_type metadata to generated documents"""
from app.db import get_database

def fix_metadata():
    db = get_database()
    
    # Update documents that have regenerated_at but no document_type
    result = db.fs.files.update_many(
        {
            'metadata.regenerated_at': {'$exists': True},
            'metadata.document_type': {'$exists': False}
        },
        {
            '$set': {'metadata.document_type': 'generated'}
        }
    )
    
    print(f"✅ Updated {result.modified_count} generated documents with document_type metadata")
    
    # Check final state
    from gridfs import GridFS
    fs = GridFS(db)
    
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
    
    print(f"\n📊 Final GridFS state:")
    print(f"   - Uploaded files: {uploaded}")
    print(f"   - Generated PDFs: {generated}")
    print(f"   - Unknown type: {unknown}")

if __name__ == "__main__":
    fix_metadata()
