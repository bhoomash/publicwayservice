#!/usr/bin/env python3
"""
Startup script for the Streamlit frontend.
"""

import subprocess
import sys
import os

# Add the project root to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

if __name__ == "__main__":
    print("🎨 Starting Streamlit Frontend...")
    print("📍 Frontend will be available at: http://localhost:8501")
    print("🔄 Auto-reload enabled for development")
    print("\n" + "="*50)
    
    # Run Streamlit
    subprocess.run([
        sys.executable, "-m", "streamlit", "run", 
        "frontend/streamlit_app.py",
        "--server.port=8501",
        "--server.address=0.0.0.0"
    ])
