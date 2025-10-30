"""Import uploaded files from uploads/ folder into GridFS"""
import sys
from pathlib import Path
from app.db import get_database
from app.utils.document_storage import get_document_storage

def import_uploaded_files():
    """Import uploaded files from disk into GridFS"""
    db = get_database()
    complaints_collection = db.complaints
    doc_storage = get_document_storage(db)
    
    # Find complaints that have file_path (uploaded files)
    complaints_with_files = list(complaints_collection.find(
        {"file_path": {"$exists": True}}
    ))
    
    print(f"\n📊 Found {len(complaints_with_files)} complaints with uploaded files\n")
    print("=" * 80)
    
    if not complaints_with_files:
        print("✅ No uploaded files to import!")
        return
    
    # Ask for confirmation
    response = input(f"\nImport {len(complaints_with_files)} uploaded files into GridFS? (yes/no): ")
    if response.lower() not in ['yes', 'y']:
        print("❌ Cancelled")
        return
    
    success_count = 0
    error_count = 0
    skipped_count = 0
    
    for i, complaint in enumerate(complaints_with_files, 1):
        complaint_id = complaint.get("id") or str(complaint.get("_id"))
        file_path = complaint.get("file_path")
        filename = complaint.get("filename")
        
        try:
            print(f"\n[{i}/{len(complaints_with_files)}] Processing: {complaint_id}")
            print(f"   File: {filename}")
            print(f"   Path: {file_path}")
            
            # Check if file exists on disk
            full_path = Path(__file__).parent / file_path
            
            if not full_path.exists():
                print(f"   ⚠️  File not found on disk: {full_path}")
                skipped_count += 1
                continue
            
            # Read the file
            with open(full_path, 'rb') as f:
                file_data = f.read()
            
            print(f"   📁 Read {len(file_data)} bytes from disk")
            
            # Delete old generated document if it exists
            old_doc_id = complaint.get("document_id")
            if old_doc_id:
                try:
                    doc_storage.delete_document(old_doc_id)
                    print(f"   🗑️  Deleted old generated document")
                except Exception as e:
                    print(f"   ⚠️  Could not delete old document: {e}")
            
            # Determine content type
            content_type = "application/pdf" if filename.lower().endswith('.pdf') else "application/octet-stream"
            
            # Store in GridFS
            document_id = doc_storage.store_document(
                file_data=file_data,
                filename=filename,
                content_type=content_type,
                metadata={
                    "complaint_id": complaint_id,
                    "user_id": complaint.get("user_id"),
                    "document_type": "uploaded",
                    "imported_from": str(file_path)
                }
            )
            
            # Update complaint with document reference
            complaints_collection.update_one(
                {"_id": complaint["_id"]},
                {
                    "$set": {
                        "document_id": document_id,
                        "document_type": "uploaded"
                    }
                }
            )
            
            print(f"   ✅ Imported to GridFS (Document ID: {document_id})")
            success_count += 1
            
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()
            error_count += 1
    
    print("\n" + "=" * 80)
    print(f"\n📊 Summary:")
    print(f"   ✅ Successfully imported: {success_count}")
    print(f"   ⏭️  Skipped (file not found): {skipped_count}")
    print(f"   ❌ Errors: {error_count}")
    print(f"   📁 Total documents in GridFS: {db.fs.files.count_documents({})}")
    
    # Show what's in GridFS now
    print("\n📁 Documents in GridFS by type:")
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
    
    print(f"   - Uploaded files: {uploaded}")
    print(f"   - Generated PDFs: {generated}")
    print(f"   - Unknown type: {unknown}")
    
    print("\n✅ Done! The actual uploaded documents are now stored in GridFS.\n")

if __name__ == "__main__":
    try:
        import_uploaded_files()
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
