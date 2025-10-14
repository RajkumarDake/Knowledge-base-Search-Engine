from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
import os
import shutil
from typing import List, Optional
import uvicorn

from rag_system import RAGSystem
from llm_client import GroqLLMClient
from config import Config

# Initialize FastAPI app
app = FastAPI(
    title="Knowledge Base Search Engine",
    description="RAG-based document search and question answering system",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
config = Config()
rag_system = RAGSystem()
llm_client = GroqLLMClient()

# Pydantic models
class QueryRequest(BaseModel):
    query: str
    max_chunks: Optional[int] = 3

class QueryResponse(BaseModel):
    success: bool
    answer: Optional[str] = None
    sources: Optional[List[dict]] = None
    error: Optional[str] = None

class DocumentStats(BaseModel):
    total_documents: int
    total_chunks: int
    documents: List[str]

# API Routes
@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the main frontend page."""
    try:
        with open("frontend/index.html", "r") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(content="""
        <html>
            <head><title>Knowledge Base Search Engine</title></head>
            <body>
                <h1>Knowledge Base Search Engine API</h1>
                <p>API is running. Visit <a href="/docs">/docs</a> for API documentation.</p>
            </body>
        </html>
        """)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "Knowledge Base Search Engine is running"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a document."""
    
    # Validate file type
    allowed_extensions = ['.pdf', '.docx', '.txt']
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    try:
        # Save uploaded file
        file_path = os.path.join(config.UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process document with RAG system
        result = rag_system.add_document(file_path)
        
        if result["success"]:
            return {
                "success": True,
                "message": result["message"],
                "document_id": result["document_id"],
                "chunks_count": result["chunks_count"],
                "filename": file.filename
            }
        else:
            # Clean up file if processing failed
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=500, detail=result["message"])
            
    except Exception as e:
        # Clean up file if error occurred
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.post("/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    """Query the knowledge base and get an AI-generated answer."""
    
    try:
        # Get relevant context from RAG system
        context = rag_system.get_context_for_query(request.query, max_chunks=request.max_chunks)
        
        if context == "No relevant documents found.":
            return QueryResponse(
                success=False,
                error="No relevant documents found for your query. Please upload some documents first."
            )
        
        # Get relevant chunks for sources
        relevant_chunks = rag_system.search(request.query, top_k=request.max_chunks)
        
        # Generate answer using LLM
        llm_result = llm_client.generate_answer(request.query, context)
        
        if llm_result["success"]:
            # Format sources
            sources = []
            for chunk in relevant_chunks:
                sources.append({
                    "document_id": chunk["document_id"],
                    "text_preview": chunk["text"][:200] + "..." if len(chunk["text"]) > 200 else chunk["text"],
                    "score": chunk["score"]
                })
            
            return QueryResponse(
                success=True,
                answer=llm_result["answer"],
                sources=sources
            )
        else:
            return QueryResponse(
                success=False,
                error=f"Error generating answer: {llm_result['error']}"
            )
            
    except Exception as e:
        return QueryResponse(
            success=False,
            error=f"Error processing query: {str(e)}"
        )

@app.get("/search")
async def search_documents(query: str, top_k: int = 5):
    """Search for relevant document chunks."""
    
    try:
        results = rag_system.search(query, top_k=top_k)
        return {
            "success": True,
            "query": query,
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching documents: {str(e)}")

@app.get("/stats", response_model=DocumentStats)
async def get_stats():
    """Get statistics about the knowledge base."""
    
    try:
        stats = rag_system.get_stats()
        return DocumentStats(
            total_documents=stats["total_documents"],
            total_chunks=stats["total_chunks"],
            documents=stats["documents"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")

@app.get("/test-llm")
async def test_llm_connection():
    """Test the connection to Groq LLM API."""
    
    result = llm_client.test_connection()
    if result["success"]:
        return result
    else:
        raise HTTPException(status_code=500, detail=result["error"])

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document from the knowledge base (placeholder - requires index rebuild)."""
    
    # Note: This is a simplified implementation
    # In a production system, you'd want to implement proper document deletion
    # which would require rebuilding the FAISS index
    
    return {
        "success": False,
        "message": "Document deletion not implemented. This would require index rebuilding."
    }

# Mount static files for frontend
try:
    app.mount("/static", StaticFiles(directory="frontend/static"), name="static")
except:
    pass  # Frontend directory might not exist yet

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
