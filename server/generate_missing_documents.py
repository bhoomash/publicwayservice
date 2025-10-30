"""Generate PDF documents for complaints that don't have documents stored"""
import sys
from app.db import get_database
from app.utils.document_storage import get_document_storage
from app.utils.pdf_generator import generate_complaint_document

def generate_documents_for_complaints():
    """Generate PDF documents for all complaints without documents"""
    db = get_database()
    complaints_collection = db.complaints
    doc_storage = get_document_storage(db)
    
    # Find complaints without documents
    complaints_without_docs = list(complaints_collection.find(
        {"$or": [
            {"document_id": {"$exists": False}},
            {"document_id": None}
        ]}
    ))
    
    print(f"\n📊 Found {len(complaints_without_docs)} complaints without documents\n")
    print("=" * 80)
    
    if not complaints_without_docs:
        print("✅ All complaints already have documents!")
        return
    
    # Ask for confirmation
    response = input(f"\nGenerate PDF documents for {len(complaints_without_docs)} complaints? (yes/no): ")
    if response.lower() not in ['yes', 'y']:
        print("❌ Cancelled")
        return
    
    success_count = 0
    error_count = 0
    
    for i, complaint in enumerate(complaints_without_docs, 1):
        complaint_id = complaint.get("id") or str(complaint.get("_id"))
        message = complaint.get("message", "")[:50]
        
        try:
            print(f"\n[{i}/{len(complaints_without_docs)}] Processing: {complaint_id}")
            print(f"   Message: {message}...")
            
            # Prepare complaint data for PDF generation
            complaint_data = {
                "id": complaint_id,
                "name": complaint.get("user_name") or complaint.get("name") or "Anonymous",
                "email": complaint.get("user_email") or complaint.get("email") or "Not provided",
                "phone": complaint.get("phone") or "Not provided",
                "category": complaint.get("category") or "General",
                "message": complaint.get("message") or "No message provided",
                "location": complaint.get("location") or "Not specified",
                "priority": complaint.get("priority") or "medium",
                "status": complaint.get("status") or "pending",
                "urgency": complaint.get("urgency") or "medium",
                "created_at": complaint.get("created_at") or complaint.get("submitted_date"),
            }
            
            # Generate PDF
            pdf_bytes = generate_complaint_document(complaint_data)
            
            # Store in GridFS
            document_id = doc_storage.store_document(
                file_data=pdf_bytes,
                filename=f"complaint_{complaint_id}.pdf",
                content_type="application/pdf",
                metadata={
                    "complaint_id": complaint_id,
                    "generated_at": "retroactive_generation"
                }
            )
            
            # Update complaint with document_id
            complaints_collection.update_one(
                {"_id": complaint["_id"]},
                {
                    "$set": {
                        "document_id": document_id,
                        "document_type": "generated"
                    }
                }
            )
            
            print(f"   ✅ Generated and stored PDF (Document ID: {document_id})")
            success_count += 1
            
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            error_count += 1
    
    print("\n" + "=" * 80)
    print(f"\n📊 Summary:")
    print(f"   ✅ Successfully generated: {success_count}")
    print(f"   ❌ Errors: {error_count}")
    print(f"   📁 Total documents in GridFS: {db.fs.files.count_documents({})}")
    print("\n✅ Done! Refresh the admin panel to view the documents.\n")

if __name__ == "__main__":
    try:
        generate_documents_for_complaints()
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
