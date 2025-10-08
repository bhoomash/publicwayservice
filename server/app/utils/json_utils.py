from bson import ObjectId
from datetime import datetime
from typing import Any, Dict, List, Union

def serialize_document(doc: Union[Dict, List]) -> Union[Dict, List]:
    """Convert MongoDB document to JSON-serializable format"""
    if isinstance(doc, list):
        return [serialize_document(item) for item in doc]
    
    if not isinstance(doc, dict):
        return doc
    
    serialized = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            serialized[key] = str(value)
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        elif isinstance(value, dict):
            serialized[key] = serialize_document(value)
        elif isinstance(value, list):
            serialized[key] = [serialize_document(item) for item in value]
        else:
            serialized[key] = value
    
    # Ensure _id is also available as id for consistency
    if '_id' in serialized:
        serialized['id'] = serialized['_id']
    
    return serialized