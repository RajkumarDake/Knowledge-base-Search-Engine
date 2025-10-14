import os
import json
import pickle
from typing import List, Dict, Tuple
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from document_processor import DocumentProcessor
from config import Config

class RAGSystem:
    """Retrieval-Augmented Generation system for document search and retrieval."""
    
    def __init__(self):
        self.config = Config()
        self.embedding_model = SentenceTransformer(self.config.EMBEDDING_MODEL)
        self.document_processor = DocumentProcessor(
            max_chunk_size=self.config.MAX_CHUNK_SIZE,
            chunk_overlap=self.config.CHUNK_OVERLAP
        )
        
        # Initialize FAISS index
        self.dimension = self.embedding_model.get_sentence_embedding_dimension()
        self.index = faiss.IndexFlatIP(self.dimension)  # Inner product for cosine similarity
        
        # Storage for document chunks and metadata
        self.chunks = []
        self.chunk_metadata = []
        
        # Load existing index if available
        self.load_index()
    
    def normalize_embeddings(self, embeddings: np.ndarray) -> np.ndarray:
        """Normalize embeddings for cosine similarity."""
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        return embeddings / norms
    
    def add_document(self, file_path: str, document_id: str = None) -> Dict:
        """Add a document to the knowledge base."""
        try:
            # Process document into chunks
            chunks = self.document_processor.process_document(file_path, document_id)
            
            if not chunks:
                return {"success": False, "message": "No text extracted from document"}
            
            # Generate embeddings for chunks
            chunk_texts = [chunk['text'] for chunk in chunks]
            embeddings = self.embedding_model.encode(chunk_texts)
            embeddings = self.normalize_embeddings(embeddings)
            
            # Add to FAISS index
            start_idx = len(self.chunks)
            self.index.add(embeddings.astype('float32'))
            
            # Store chunks and metadata
            self.chunks.extend(chunks)
            for i, chunk in enumerate(chunks):
                self.chunk_metadata.append({
                    'index': start_idx + i,
                    'document_id': chunk['document_id'],
                    'document_path': chunk['document_path'],
                    'chunk_id': chunk['id'],
                    'chunk_index': chunk['chunk_index']
                })
            
            # Save updated index
            self.save_index()
            
            return {
                "success": True,
                "message": f"Successfully added {len(chunks)} chunks from document",
                "document_id": chunks[0]['document_id'],
                "chunks_count": len(chunks)
            }
            
        except Exception as e:
            return {"success": False, "message": f"Error processing document: {str(e)}"}
    
    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """Search for relevant chunks based on query."""
        if self.index.ntotal == 0:
            return []
        
        # Generate query embedding
        query_embedding = self.embedding_model.encode([query])
        query_embedding = self.normalize_embeddings(query_embedding)
        
        # Search in FAISS index
        scores, indices = self.index.search(query_embedding.astype('float32'), top_k)
        
        # Prepare results
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(self.chunks):
                chunk = self.chunks[idx]
                metadata = self.chunk_metadata[idx]
                
                results.append({
                    'chunk_id': chunk['id'],
                    'document_id': chunk['document_id'],
                    'document_path': chunk['document_path'],
                    'text': chunk['text'],
                    'score': float(score),
                    'chunk_index': chunk['chunk_index']
                })
        
        return results
    
    def get_context_for_query(self, query: str, max_chunks: int = 3) -> str:
        """Get relevant context for a query to use in LLM prompt."""
        relevant_chunks = self.search(query, top_k=max_chunks)
        
        if not relevant_chunks:
            return "No relevant documents found."
        
        context_parts = []
        for i, chunk in enumerate(relevant_chunks, 1):
            context_parts.append(f"Document {i} (from {chunk['document_id']}):\n{chunk['text']}")
        
        return "\n\n".join(context_parts)
    
    def save_index(self):
        """Save FAISS index and metadata to disk."""
        try:
            # Save FAISS index
            faiss.write_index(self.index, os.path.join(self.config.VECTOR_DB_PATH, "faiss_index.bin"))
            
            # Save chunks and metadata
            with open(os.path.join(self.config.VECTOR_DB_PATH, "chunks.pkl"), 'wb') as f:
                pickle.dump(self.chunks, f)
            
            with open(os.path.join(self.config.VECTOR_DB_PATH, "metadata.pkl"), 'wb') as f:
                pickle.dump(self.chunk_metadata, f)
                
        except Exception as e:
            print(f"Error saving index: {e}")
    
    def load_index(self):
        """Load FAISS index and metadata from disk."""
        try:
            index_path = os.path.join(self.config.VECTOR_DB_PATH, "faiss_index.bin")
            chunks_path = os.path.join(self.config.VECTOR_DB_PATH, "chunks.pkl")
            metadata_path = os.path.join(self.config.VECTOR_DB_PATH, "metadata.pkl")
            
            if os.path.exists(index_path) and os.path.exists(chunks_path) and os.path.exists(metadata_path):
                # Load FAISS index
                self.index = faiss.read_index(index_path)
                
                # Load chunks and metadata
                with open(chunks_path, 'rb') as f:
                    self.chunks = pickle.load(f)
                
                with open(metadata_path, 'rb') as f:
                    self.chunk_metadata = pickle.load(f)
                
                print(f"Loaded existing index with {len(self.chunks)} chunks")
            
        except Exception as e:
            print(f"Error loading index: {e}")
    
    def get_stats(self) -> Dict:
        """Get statistics about the knowledge base."""
        documents = set(chunk['document_id'] for chunk in self.chunks)
        
        return {
            'total_chunks': len(self.chunks),
            'total_documents': len(documents),
            'documents': list(documents),
            'index_size': self.index.ntotal
        }
