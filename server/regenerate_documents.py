"""Regenerate PDF documents with correct field mappings"""
import sys
from app.db import get_database
from app.utils.document_storage import get_document_storage
from app.utils.pdf_generator import generate_complaint_document
from datetime import datetime
from bson import ObjectId

def regenerate_documents():
    """Regenerate PDF documents with proper field mappings"""
    db = get_database()
    complaints_collection = db.complaints
    users_collection = db.users
    doc_storage = get_document_storage(db)
    
    # Get all complaints with documents
    complaints_with_docs = list(complaints_collection.find(
        {"document_id": {"$exists": True}}
    ))
    
    print(f"\n📊 Found {len(complaints_with_docs)} complaints with documents\n")
    print("=" * 80)
    
    if not complaints_with_docs:
        print("❌ No complaints with documents found!")
        return
    
    # Ask for confirmation
    response = input(f"\nRegenerate PDF documents for {len(complaints_with_docs)} complaints? (yes/no): ")
    if response.lower() not in ['yes', 'y']:
        print("❌ Cancelled")
        return
    
    success_count = 0
    error_count = 0
    
    for i, complaint in enumerate(complaints_with_docs, 1):
        complaint_id = complaint.get("id") or str(complaint.get("_id"))
        title = complaint.get("title", "")[:50]
        
        try:
            print(f"\n[{i}/{len(complaints_with_docs)}] Processing: {complaint_id}")
            print(f"   Title: {title}...")
            
            # Get user information
            user_name = "Anonymous"
            user_phone = "Not provided"
            
            user_id = complaint.get("user_id")
            if user_id:
                # Convert string user_id to ObjectId if needed
                try:
                    if isinstance(user_id, str):
                        user_id_obj = ObjectId(user_id)
                    else:
                        user_id_obj = user_id
                    
                    user = users_collection.find_one({"_id": user_id_obj})
                    if user:
                        # Combine first_name and last_name
                        first_name = user.get("first_name", "")
                        last_name = user.get("last_name", "")
                        if first_name or last_name:
                            user_name = f"{first_name} {last_name}".strip()
                        elif user.get("name"):
                            user_name = user.get("name")
                        elif user.get("full_name"):
                            user_name = user.get("full_name")
                        
                        user_phone = user.get("phone") or user.get("phone_number") or "Not provided"
                except Exception as e:
                    print(f"   ⚠️  Could not fetch user: {e}")
            
            # Prepare complaint data for PDF generation with correct field mappings
            complaint_data = {
                "id": complaint_id,
                "name": user_name,
                "email": complaint.get("user_email") or complaint.get("email") or "Not provided",
                "phone": user_phone,
                "category": complaint.get("category") or "General",
                "message": complaint.get("description") or complaint.get("message") or complaint.get("title") or "No message provided",
                "location": complaint.get("location") or "Not specified",
                "priority": complaint.get("priority") or "Medium",
                "status": complaint.get("status") or "Pending",
                "urgency": complaint.get("urgency") or "Medium",
                "created_at": complaint.get("created_at") or complaint.get("submitted_date") or datetime.now(),
            }
            
            print(f"   User: {complaint_data['name']}")
            print(f"   Email: {complaint_data['email']}")
            
            # Generate new PDF
            pdf_bytes = generate_complaint_document(complaint_data)
            
            # Delete old document from GridFS
            old_doc_id = complaint.get("document_id")
            if old_doc_id:
                try:
                    doc_storage.delete_document(old_doc_id)
                except:
                    pass  # Old doc might not exist
            
            # Store new document in GridFS
            document_id = doc_storage.store_document(
                file_data=pdf_bytes,
                filename=f"complaint_{complaint_id}.pdf",
                content_type="application/pdf",
                metadata={
                    "complaint_id": complaint_id,
                    "regenerated_at": datetime.now().isoformat()
                }
            )
            
            # Update complaint with new document_id
            complaints_collection.update_one(
                {"_id": complaint["_id"]},
                {
                    "$set": {
                        "document_id": document_id,
                        "document_type": "generated"
                    }
                }
            )
            
            print(f"   ✅ Regenerated PDF (Document ID: {document_id})")
            success_count += 1
            
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()
            error_count += 1
    
    print("\n" + "=" * 80)
    print(f"\n📊 Summary:")
    print(f"   ✅ Successfully regenerated: {success_count}")
    print(f"   ❌ Errors: {error_count}")
    print(f"   📁 Total documents in GridFS: {db.fs.files.count_documents({})}")
    print("\n✅ Done! Refresh the admin panel to view the updated documents.\n")

if __name__ == "__main__":
    try:
        regenerate_documents()
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
