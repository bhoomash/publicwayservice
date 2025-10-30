"""
Document storage utilities using MongoDB GridFS
Handles storing and retrieving complaint documents (uploaded files and generated PDFs)
"""
from __future__ import annotations

import io
from datetime import datetime
from typing import BinaryIO, Optional, Dict, Any

from bson import ObjectId
from gridfs import GridFS
from pymongo.database import Database


class DocumentStorage:
    """Manages document storage in MongoDB GridFS"""
    
    def __init__(self, database: Database):
        """Initialize GridFS with database connection"""
        self.fs = GridFS(database)
    
    def store_document(
        self,
        file_data: bytes,
        filename: str,
        content_type: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Store a document in GridFS
        
        Args:
            file_data: Binary file content
            filename: Original filename
            content_type: MIME type (e.g., 'application/pdf')
            metadata: Additional metadata to store with the file
        
        Returns:
            GridFS file ID as string
        """
        file_stream = io.BytesIO(file_data)
        
        file_metadata = metadata or {}
        file_metadata.update({
            "uploaded_at": datetime.utcnow(),
            "original_filename": filename,
            "content_type": content_type
        })
        
        file_id = self.fs.put(
            file_stream,
            filename=filename,
            content_type=content_type,
            metadata=file_metadata
        )
        
        return str(file_id)
    
    def get_document(self, file_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a document from GridFS
        
        Args:
            file_id: GridFS file ID
        
        Returns:
            Dictionary containing:
                - data: Binary file content
                - filename: Original filename
                - content_type: MIME type
                - metadata: Additional stored metadata
        """
        try:
            grid_out = self.fs.get(ObjectId(file_id))
            
            return {
                "data": grid_out.read(),
                "filename": grid_out.filename,
                "content_type": grid_out.content_type,
                "metadata": grid_out.metadata,
                "upload_date": grid_out.upload_date,
                "length": grid_out.length
            }
        except Exception as e:
            print(f"Error retrieving document {file_id}: {e}")
            return None
    
    def delete_document(self, file_id: str) -> bool:
        """
        Delete a document from GridFS
        
        Args:
            file_id: GridFS file ID
        
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            self.fs.delete(ObjectId(file_id))
            return True
        except Exception as e:
            print(f"Error deleting document {file_id}: {e}")
            return False
    
    def document_exists(self, file_id: str) -> bool:
        """Check if a document exists in GridFS"""
        try:
            return self.fs.exists(ObjectId(file_id))
        except:
            return False


def get_document_storage(database: Database) -> DocumentStorage:
    """Get DocumentStorage instance"""
    return DocumentStorage(database)
