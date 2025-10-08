#!/usr/bin/env python3
"""
Simple script to run the FastAPI server
"""
import sys
import os

# Add the server directory to Python path
server_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, server_dir)

import uvicorn
from app.main import app

if __name__ == "__main__":
    print("🚀 Starting Government Portal API Server...")
    print("📍 Server will be available at: http://localhost:8001")
    print("📖 API Documentation: http://localhost:8001/docs")
    print("=" * 50)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        reload=False,
        log_level="info"
    )