from typing import Dict, Any, List, Optional
import logging
import os
import uuid
from datetime import datetime

from app.utils.document_processor import DocumentProcessor
from app.vector_store.chroma_store import ChromaVectorStore
from app.llm.gemini_client import GeminiClient
from app.rag_config import Config

logger = logging.getLogger(__name__)

class RAGPipeline:
    """Main RAG pipeline for complaint processing."""
    
    def __init__(self):
        self.document_processor = DocumentProcessor()
        self.vector_store = ChromaVectorStore()
        self.llm_client = GeminiClient()
        
        # Ensure upload directory exists
        os.makedirs(Config.UPLOAD_DIR, exist_ok=True)
    
    def process_uploaded_file(self, file_path: str, filename: str) -> Dict[str, Any]:
        """Process an uploaded complaint file through the complete RAG pipeline."""
        try:
            logger.info(f"Processing file: {filename}")
            
            # Step 1: Extract text from document
            raw_text = self.document_processor.extract_text(file_path)
            cleaned_text = self.document_processor.clean_text(raw_text)
            
            if not cleaned_text.strip():
                raise ValueError("No text content found in the document")
            
            # Step 2: Process with LLM for classification and summarization
            llm_result = self.llm_client.process_complaint(cleaned_text)
            relevance = self.llm_client.assess_relevance(cleaned_text)

            base_response = {
                "document_id": None,
                "filename": filename,
                "summary": llm_result["summary"],
                "urgency": llm_result["urgency"],
                "color": llm_result["color"],
                "emoji": llm_result["emoji"],
                "department": llm_result["department"],
                "location": llm_result["location"],
                "text_length": len(cleaned_text),
                "upload_date": datetime.now().isoformat(),
                "is_relevant": relevance.get("is_relevant", True),
                "relevance_confidence": relevance.get("confidence", 0.0),
                "relevance_category": relevance.get("category", "unknown"),
                "relevance_reason": relevance.get("reason", "")
            }

            if not base_response["is_relevant"]:
                logger.warning(
                    "Submission flagged as irrelevant (category=%s, confidence=%.2f): %s",
                    base_response["relevance_category"],
                    base_response["relevance_confidence"],
                    filename
                )
                return base_response
            
            # Step 3: Store in vector database
            metadata = {
                "filename": filename,
                "upload_date": base_response["upload_date"],
                "file_path": file_path,
                "summary": llm_result["summary"],
                "urgency": llm_result["urgency"],
                "department": llm_result["department"],
                "location": llm_result["location"],
                "color": llm_result["color"],
                "emoji": llm_result["emoji"],
                "relevance_confidence": base_response["relevance_confidence"],
                "relevance_category": base_response["relevance_category"]
            }
            
            doc_id = self.vector_store.add_document(
                text=cleaned_text,
                metadata=metadata
            )
            
            # Step 4: Prepare response
            result = {**base_response, "document_id": doc_id, "is_relevant": True}
            
            logger.info(f"Successfully processed {filename} with ID: {doc_id}")
            return result
            
        except Exception as e:
            logger.error(f"Error processing file {filename}: {str(e)}")
            raise

    def process_text_complaint(self,
                               title: str,
                               description: str,
                               metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Process a text-based complaint through the RAG pipeline."""
        try:
            combined_text = f"{title.strip()} {description.strip()}".strip()

            if not combined_text:
                raise ValueError("Complaint text is empty")

            cleaned_text = self.document_processor.clean_text(combined_text)

            if not cleaned_text:
                raise ValueError("No meaningful content found in the complaint text")

            # Process with LLM for classification and summarization
            llm_result = self.llm_client.process_complaint(cleaned_text)
            relevance = self.llm_client.assess_relevance(cleaned_text)

            base_metadata = {
                "filename": f"text_submission_{uuid.uuid4().hex}.txt",
                "upload_date": datetime.now().isoformat(),
                "source": "text_submission",
                "title": title,
                "summary": llm_result["summary"],
                "urgency": llm_result["urgency"],
                "department": llm_result["department"],
                "location": llm_result["location"],
                "relevance_confidence": relevance.get("confidence", 0.0),
                "relevance_category": relevance.get("category", "unknown")
            }

            if metadata:
                # Only include metadata values that are not None
                base_metadata.update({k: v for k, v in metadata.items() if v is not None})

            result = {
                "document_id": None,
                "summary": llm_result["summary"],
                "urgency": llm_result["urgency"],
                "color": llm_result["color"],
                "emoji": llm_result["emoji"],
                "department": llm_result["department"],
                "location": llm_result["location"],
                "text_length": len(cleaned_text),
                "metadata": base_metadata,
                "is_relevant": relevance.get("is_relevant", True),
                "relevance_confidence": relevance.get("confidence", 0.0),
                "relevance_category": relevance.get("category", "unknown"),
                "relevance_reason": relevance.get("reason", "")
            }

            if not result["is_relevant"]:
                logger.warning(
                    "Text submission flagged as irrelevant (category=%s, confidence=%.2f) for user=%s",
                    result["relevance_category"],
                    result["relevance_confidence"],
                    metadata.get("user_id") if metadata else "unknown"
                )
                return result

            doc_id = self.vector_store.add_document(
                text=cleaned_text,
                metadata=base_metadata
            )

            result["document_id"] = doc_id
            result["is_relevant"] = True

            logger.info(
                "Processed text complaint with document ID %s (department=%s, urgency=%s)",
                doc_id,
                llm_result["department"],
                llm_result["urgency"]
            )

            return result

        except Exception as e:
            logger.error(f"Error processing text complaint '{title}': {str(e)}")
            raise
    
    def search_similar_complaints(self, 
                                 query: str, 
                                 n_results: int = 5,
                                 department_filter: Optional[str] = None,
                                 urgency_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search for similar complaints in the vector store."""
        try:
            # Build metadata filter
            filter_metadata = {}
            if department_filter:
                filter_metadata["department"] = department_filter
            if urgency_filter:
                filter_metadata["urgency"] = urgency_filter
            
            # Search in vector store
            results = self.vector_store.search_similar(
                query=query,
                n_results=n_results,
                filter_metadata=filter_metadata if filter_metadata else None
            )
            
            # Format results for response
            formatted_results = []
            for result in results:
                formatted_results.append({
                    "document_id": result["id"],
                    "similarity_score": 1 - result["distance"] if result["distance"] else 1.0,
                    "summary": result["metadata"].get("summary", ""),
                    "urgency": result["metadata"].get("urgency", ""),
                    "department": result["metadata"].get("department", ""),
                    "location": result["metadata"].get("location", "Location not specified"),
                    "color": result["metadata"].get("color", ""),
                    "emoji": result["metadata"].get("emoji", ""),
                    "filename": result["metadata"].get("filename", ""),
                    "upload_date": result["metadata"].get("upload_date", ""),
                    "text_preview": result["document"][:200] + "..." if len(result["document"]) > 200 else result["document"]
                })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching complaints: {str(e)}")
            raise
    
    def get_complaint_details(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific complaint."""
        try:
            result = self.vector_store.get_document(document_id)
            if not result:
                return None
            
            return {
                "document_id": result["id"],
                "full_text": result["document"],
                "summary": result["metadata"].get("summary", ""),
                "urgency": result["metadata"].get("urgency", ""),
                "department": result["metadata"].get("department", ""),
                "location": result["metadata"].get("location", "Location not specified"),
                "color": result["metadata"].get("color", ""),
                "emoji": result["metadata"].get("emoji", ""),
                "filename": result["metadata"].get("filename", ""),
                "upload_date": result["metadata"].get("upload_date", ""),
                "file_path": result["metadata"].get("file_path", "")
            }
            
        except Exception as e:
            logger.error(f"Error getting complaint details: {str(e)}")
            return None
    
    def add_complaint_to_vector_db(self,
                                   complaint_id: str,
                                   title: str,
                                   description: str,
                                   category: str,
                                   location: str,
                                   status: str = "pending",
                                   metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Add a text-based complaint directly to the vector database."""
        try:
            logger.info(f"Adding complaint {complaint_id} to vector database")
            
            # Combine title and description for better search
            full_text = f"{title}\n\n{description}"
            
            # Prepare metadata
            complaint_metadata = {
                "complaint_id": complaint_id,
                "title": title,
                "category": category,
                "location": location,
                "status": status,
                "upload_date": datetime.now().isoformat(),
                "source": "direct_submission"
            }
            
            # Merge with additional metadata if provided
            if metadata:
                complaint_metadata.update(metadata)
            
            # Add to vector store
            doc_id = self.vector_store.add_document(
                text=full_text,
                metadata=complaint_metadata
            )
            
            logger.info(f"Successfully added complaint {complaint_id} with vector ID: {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding complaint to vector DB: {str(e)}")
            raise
    
    def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get dashboard statistics."""
        try:
            collection_stats = self.vector_store.get_collection_stats()
            
            # Get all documents to calculate department and urgency distributions
            # Note: In a production system, you'd want to optimize this
            all_results = self.vector_store.search_similar("", n_results=1000)
            
            department_counts = {}
            urgency_counts = {}
            
            for result in all_results:
                dept = result["metadata"].get("department", "Unknown")
                urgency = result["metadata"].get("urgency", "Unknown")
                
                department_counts[dept] = department_counts.get(dept, 0) + 1
                urgency_counts[urgency] = urgency_counts.get(urgency, 0) + 1
            
            return {
                "total_complaints": collection_stats["total_documents"],
                "department_distribution": department_counts,
                "urgency_distribution": urgency_counts,
                "collection_name": collection_stats["collection_name"]
            }
            
        except Exception as e:
            logger.error(f"Error getting dashboard stats: {str(e)}")
            return {
                "total_complaints": 0,
                "department_distribution": {},
                "urgency_distribution": {},
                "collection_name": "complaints"
            }
