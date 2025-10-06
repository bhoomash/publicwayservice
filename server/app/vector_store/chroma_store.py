try:
    import chromadb
    from chromadb.config import Settings
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False

from sentence_transformers import SentenceTransformer
import uuid
from typing import List, Dict, Any, Optional
import logging
import json
import os
import numpy as np
from app.rag_config import Config

logger = logging.getLogger(__name__)

class ChromaVectorStore:
    """Vector store for complaint documents (with fallback to in-memory storage)."""
    
    def __init__(self, collection_name: str = "complaints"):
        self.collection_name = collection_name
        self.embedding_model = SentenceTransformer(Config.EMBEDDING_MODEL)
        
        # Try to use ChromaDB if available, otherwise use in-memory storage
        if CHROMADB_AVAILABLE:
            try:
                logger.info("Attempting to initialize ChromaDB...")
                # Create persistent directory if it doesn't exist
                persist_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "chroma_db")
                os.makedirs(persist_dir, exist_ok=True)
                
                # Use PersistentClient instead of Client
                self.client = chromadb.PersistentClient(path=persist_dir)
                self.collection = self.client.get_or_create_collection(name=collection_name)
                self.use_chromadb = True
                logger.info(f"✅ Using ChromaDB persistent mode at {persist_dir} for collection: {collection_name}")
            except Exception as e:
                logger.warning(f"ChromaDB initialization failed: {e}. Falling back to simple vector store.")
                self._init_simple_store()
                self.use_chromadb = False
        else:
            logger.warning("ChromaDB not available. Using simple in-memory vector store.")
            self._init_simple_store()
            self.use_chromadb = False
    
    def _init_simple_store(self):
        """Initialize simple in-memory vector store as fallback."""
        self.documents = {}  # {doc_id: {"text": str, "embedding": list, "metadata": dict}}
        logger.info(f"✅ Initialized simple vector store for collection: {self.collection_name}")
    
    def add_document(self, 
                    text: str, 
                    metadata: Dict[str, Any], 
                    doc_id: Optional[str] = None) -> str:
        """Add a document to the vector store."""
        if doc_id is None:
            doc_id = str(uuid.uuid4())
        
        # Generate embeddings
        embedding = self.embedding_model.encode(text).tolist()
        
        if self.use_chromadb:
            # Add to ChromaDB
            self.collection.add(
                embeddings=[embedding],
                documents=[text],
                metadatas=[metadata],
                ids=[doc_id]
            )
        else:
            # Add to simple store
            self.documents[doc_id] = {
                "text": text,
                "embedding": embedding,
                "metadata": metadata
            }
        
        logger.info(f"Added document with ID: {doc_id}")
        return doc_id
    
    def search_similar(self, 
                      query: str, 
                      n_results: int = 5,
                      filter_metadata: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Search for similar documents."""
        query_embedding = self.embedding_model.encode(query).tolist()
        
        if self.use_chromadb:
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
        else:
            # Simple cosine similarity search
            query_embedding_np = np.array(query_embedding)
            results = []
            
            for doc_id, doc_data in self.documents.items():
                # Apply filter if provided
                if filter_metadata:
                    match = all(doc_data['metadata'].get(k) == v for k, v in filter_metadata.items())
                    if not match:
                        continue
                
                # Calculate cosine similarity
                doc_embedding_np = np.array(doc_data['embedding'])
                similarity = np.dot(query_embedding_np, doc_embedding_np) / (
                    np.linalg.norm(query_embedding_np) * np.linalg.norm(doc_embedding_np)
                )
                distance = 1 - similarity
                
                results.append({
                    'id': doc_id,
                    'document': doc_data['text'],
                    'metadata': doc_data['metadata'],
                    'distance': float(distance),
                    'similarity': float(similarity)
                })
            
            # Sort by distance (lower is better) and return top n
            results.sort(key=lambda x: x['distance'])
            return results[:n_results]
    
    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific document by ID."""
        try:
            if self.use_chromadb:
                result = self.collection.get(ids=[doc_id])
                if result['ids']:
                    return {
                        'id': result['ids'][0],
                        'document': result['documents'][0],
                        'metadata': result['metadatas'][0]
                    }
                return None
            else:
                doc_data = self.documents.get(doc_id)
                if doc_data:
                    return {
                        'id': doc_id,
                        'document': doc_data['text'],
                        'metadata': doc_data['metadata']
                    }
                return None
        except Exception as e:
            logger.error(f"Error retrieving document {doc_id}: {str(e)}")
            return None
    
    def delete_document(self, doc_id: str) -> bool:
        """Delete a document from the vector store."""
        try:
            if self.use_chromadb:
                self.collection.delete(ids=[doc_id])
            else:
                if doc_id in self.documents:
                    del self.documents[doc_id]
            logger.info(f"Deleted document with ID: {doc_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting document {doc_id}: {str(e)}")
            return False
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the collection."""
        if self.use_chromadb:
            count = self.collection.count()
        else:
            count = len(self.documents)
        return {
            "total_documents": count,
            "collection_name": self.collection_name,
            "backend": "chromadb" if self.use_chromadb else "simple"
        }
