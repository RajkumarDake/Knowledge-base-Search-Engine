#!/usr/bin/env python3
"""
Startup script for Knowledge Base Search Engine
"""

import os
import sys
import subprocess
import webbrowser
import time
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed."""
    try:
        import fastapi
        import uvicorn
        import sentence_transformers
        import faiss
        print("All dependencies are installed")
        return True
    except ImportError as e:
        print(f"Missing dependency: {e}")
        print("Please run: pip install -r requirements.txt")
        return False

def check_directories():
    """Ensure required directories exist."""
    directories = ['uploads', 'vector_db', 'frontend/static']
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
    
    print("Directory structure verified")

def start_server():
    """Start the FastAPI server."""
    print("Starting Knowledge Base Search Engine...")
    print("Server will be available at: http://localhost:8000")
    print("API documentation at: http://localhost:8000/docs")
    print("\nPress Ctrl+C to stop the server")
    
    try:
        # Start server
        import uvicorn
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\nServer stopped")
    except Exception as e:
        print(f"Error starting server: {e}")

def main():
    print("Knowledge Base Search Engine")
    print("=" * 40)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Check directories
    check_directories()
    
    # Test configuration
    try:
        from config import Config
        config = Config()
        print(f"Configuration loaded")
        print(f"   Model: {config.GROQ_MODEL}")
        print(f"   Embedding: {config.EMBEDDING_MODEL}")
    except Exception as e:
        print(f"Configuration error: {e}")
        sys.exit(1)
    
    # Start server
    start_server()

if __name__ == "__main__":
    main()
