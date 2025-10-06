import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import uuid
from typing import List, Dict, Any, Optional
import logging
from config import Config

logger = logging.getLogger(__name__)

class ChromaVectorStore:
    """ChromaDB vector store for complaint documents."""
    
    def __init__(self, collection_name: str = "complaints"):
        self.client = chromadb.PersistentClient(
            path=Config.CHROMA_DB_PATH,
            settings=Settings(anonymized_telemetry=False)
        )
        self.collection_name = collection_name
        self.embedding_model = SentenceTransformer(Config.EMBEDDING_MODEL)
        
        # Get or create collection
        try:
            self.collection = self.client.get_collection(name=collection_name)
            logger.info(f"Loaded existing collection: {collection_name}")
        except Exception:
            self.collection = self.client.create_collection(name=collection_name)
            logger.info(f"Created new collection: {collection_name}")
    
    def add_document(self, 
                    text: str, 
                    metadata: Dict[str, Any], 
                    doc_id: Optional[str] = None) -> str:
        """Add a document to the vector store."""
        if doc_id is None:
            doc_id = str(uuid.uuid4())
        
        # Generate embeddings
        embedding = self.embedding_model.encode(text).tolist()
        
        # Add to ChromaDB
        self.collection.add(
            embeddings=[embedding],
            documents=[text],
            metadatas=[metadata],
            ids=[doc_id]
        )
        
        logger.info(f"Added document with ID: {doc_id}")
        return doc_id
    
    def search_similar(self, 
                      query: str, 
                      n_results: int = 5,
                      filter_metadata: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Search for similar documents."""
        query_embedding = self.embedding_model.encode(query).tolist()
        
        search_kwargs = {
            "query_embeddings": [query_embedding],
            "n_results": n_results
        }
        
        if filter_metadata:
            search_kwargs["where"] = filter_metadata
        
        results = self.collection.query(**search_kwargs)
        
        # Format results
        formatted_results = []
        for i in range(len(results['ids'][0])):
            formatted_results.append({
                'id': results['ids'][0][i],
                'document': results['documents'][0][i],
                'metadata': results['metadatas'][0][i],
                'distance': results['distances'][0][i] if 'distances' in results else None
            })
        
        return formatted_results
    
    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific document by ID."""
        try:
            result = self.collection.get(ids=[doc_id])
            if result['ids']:
                return {
                    'id': result['ids'][0],
                    'document': result['documents'][0],
                    'metadata': result['metadatas'][0]
                }
            return None
        except Exception as e:
            logger.error(f"Error retrieving document {doc_id}: {str(e)}")
            return None
    
    def delete_document(self, doc_id: str) -> bool:
        """Delete a document from the vector store."""
        try:
            self.collection.delete(ids=[doc_id])
            logger.info(f"Deleted document with ID: {doc_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting document {doc_id}: {str(e)}")
            return False
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the collection."""
        count = self.collection.count()
        return {
            "total_documents": count,
            "collection_name": self.collection_name
        }
