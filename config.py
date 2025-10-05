import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    CHROMA_DB_PATH = "./chroma_db"
    UPLOAD_DIR = "./uploads"
    
    # Embedding model configuration
    EMBEDDING_MODEL = "all-MiniLM-L6-v2"
    
    # Gemini model configuration
    GEMINI_MODEL = "gemini-2.0-flash"
    
    # Department categories
    DEPARTMENTS = [
        "Transport Department",
        "Municipality",
        "Sanitation Department",
        "Health Department",
        "Water Department",
        "Electricity Department",
        "Public Works Department",
        "Environment Department",
        "Education Department",
        "Police Department"
    ]
    
    # Urgency levels
    URGENCY_LEVELS = {
        "High": {"color": "Red", "emoji": "🔴"},
        "Medium": {"color": "Orange", "emoji": "🟠"},
        "Low": {"color": "Green", "emoji": "🟢"}
    }
