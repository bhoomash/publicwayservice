"""Generate documents for complaints that are missing them"""
from app.db import get_database
from app.utils.document_storage import get_document_storage
from app.utils.pdf_generator import generate_complaint_document
from bson import ObjectId

def generate_missing_documents():
    """Generate PDF documents for complaints without document_id"""
    db = get_database()
    complaints_collection = db.complaints
    doc_storage = get_document_storage(db)
    
    # Find complaints without documents
    missing_docs = list(complaints_collection.find({"document_id": {"$exists": False}}))
    
    print(f"\n📊 Found {len(missing_docs)} complaints without documents")
    
    if not missing_docs:
        print("✅ All complaints have documents!")
        return
    
    print("=" * 80)
    
    success = 0
    failed = 0
    
    for i, complaint in enumerate(missing_docs, 1):
        # Get complaint ID (check both 'id' and '_id' fields)
        complaint_id = complaint.get('id')
        if not complaint_id:
            complaint_id = str(complaint.get('_id'))
            # Update the complaint with the 'id' field if missing
            complaints_collection.update_one(
                {"_id": complaint["_id"]},
                {"$set": {"id": complaint_id}}
            )
        
        title = complaint.get('title', 'N/A')[:50]
        
        print(f"\n[{i}/{len(missing_docs)}] Processing: {complaint_id}")
        print(f"   Title: {title}")
        
        try:
            # Get user information if user_id exists
            user_id = complaint.get('user_id')
            if user_id:
                try:
                    # Convert to ObjectId if it's a string
                    if isinstance(user_id, str) and len(user_id) == 24:
                        user_oid = ObjectId(user_id)
                    else:
                        user_oid = user_id
                    
                    user = db.users.find_one({"_id": user_oid})
                    if user:
                        # Update complaint with user info if missing
                        updates = {}
                        if not complaint.get('user_name'):
                            full_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
                            if full_name:
                                updates['user_name'] = full_name
                        
                        if not complaint.get('user_email'):
                            if user.get('email'):
                                updates['user_email'] = user.get('email')
                        
                        if updates:
                            complaints_collection.update_one(
                                {"_id": complaint["_id"]},
                                {"$set": updates}
                            )
                            complaint.update(updates)
                            print(f"   ✓ Updated user information")
                except Exception as e:
                    print(f"   ⚠️  Could not fetch user info: {e}")
            
            # Generate PDF from complaint data
            complaint_data = dict(complaint)
            
            # Ensure required fields have defaults
            complaint_data.setdefault('id', complaint_id)
            complaint_data.setdefault('user_name', 'N/A')
            complaint_data.setdefault('user_email', complaint_data.get('contact_email', 'N/A'))
            complaint_data.setdefault('contact_phone', 'N/A')
            complaint_data.setdefault('category', 'General')
            complaint_data.setdefault('location', 'N/A')
            complaint_data.setdefault('urgency', 'medium')
            complaint_data.setdefault('priority', 'medium')
            complaint_data.setdefault('status', 'pending')
            
            pdf_bytes = generate_complaint_document(complaint_data)
            print(f"   📝 Generated PDF ({len(pdf_bytes)} bytes)")
            
            # Store in GridFS
            document_id = doc_storage.store_document(
                file_data=pdf_bytes,
                filename=f"complaint_{complaint_id}.pdf",
                content_type="application/pdf",
                metadata={
                    "complaint_id": complaint_id,
                    "user_id": user_id or "unknown",
                    "document_type": "generated"
                }
            )
            
            # Update complaint with document reference
            complaints_collection.update_one(
                {"_id": complaint["_id"]},
                {"$set": {
                    "document_id": document_id,
                    "document_type": "generated"
                }}
            )
            
            print(f"   ✅ Stored document (ID: {document_id})")
            success += 1
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            import traceback
            traceback.print_exc()
            failed += 1
    
    print("\n" + "=" * 80)
    print(f"📊 Summary:")
    print(f"   ✅ Success: {success}")
    print(f"   ❌ Failed: {failed}")
    print(f"   📁 Total complaints with documents: {complaints_collection.count_documents({'document_id': {'$exists': True}})}")

if __name__ == "__main__":
    generate_missing_documents()
