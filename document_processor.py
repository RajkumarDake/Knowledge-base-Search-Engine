import os
import re
from typing import List, Dict
import PyPDF2
import docx
from pathlib import Path

class DocumentProcessor:
    """Handles document ingestion and text extraction from various file formats."""
    
    def __init__(self, max_chunk_size: int = 1000, chunk_overlap: int = 200):
        self.max_chunk_size = max_chunk_size
        self.chunk_overlap = chunk_overlap
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file."""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            print(f"Error extracting text from PDF {file_path}: {e}")
        return text
    
    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file."""
        text = ""
        try:
            doc = docx.Document(file_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        except Exception as e:
            print(f"Error extracting text from DOCX {file_path}: {e}")
        return text
    
    def extract_text_from_txt(self, file_path: str) -> str:
        """Extract text from TXT file."""
        text = ""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
        except Exception as e:
            print(f"Error extracting text from TXT {file_path}: {e}")
        return text
    
    def extract_text(self, file_path: str) -> str:
        """Extract text from supported file formats."""
        file_extension = Path(file_path).suffix.lower()
        
        if file_extension == '.pdf':
            return self.extract_text_from_pdf(file_path)
        elif file_extension == '.docx':
            return self.extract_text_from_docx(file_path)
        elif file_extension == '.txt':
            return self.extract_text_from_txt(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        return text
    
    def chunk_text(self, text: str) -> List[Dict[str, str]]:
        """Split text into overlapping chunks."""
        text = self.clean_text(text)
        chunks = []
        
        # Simple sentence-aware chunking
        sentences = re.split(r'[.!?]+', text)
        current_chunk = ""
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
                
            # Check if adding this sentence would exceed chunk size
            if len(current_chunk) + len(sentence) > self.max_chunk_size:
                if current_chunk:
                    chunks.append({
                        'text': current_chunk.strip(),
                        'length': len(current_chunk)
                    })
                    
                    # Start new chunk with overlap
                    overlap_text = current_chunk[-self.chunk_overlap:] if len(current_chunk) > self.chunk_overlap else current_chunk
                    current_chunk = overlap_text + " " + sentence
                else:
                    # Single sentence is too long, split it
                    words = sentence.split()
                    for i in range(0, len(words), self.max_chunk_size // 10):
                        chunk_words = words[i:i + self.max_chunk_size // 10]
                        chunk_text = " ".join(chunk_words)
                        chunks.append({
                            'text': chunk_text,
                            'length': len(chunk_text)
                        })
            else:
                current_chunk += " " + sentence if current_chunk else sentence
        
        # Add the last chunk
        if current_chunk:
            chunks.append({
                'text': current_chunk.strip(),
                'length': len(current_chunk)
            })
        
        return chunks
    
    def process_document(self, file_path: str, document_id: str = None) -> List[Dict]:
        """Process a document and return chunks with metadata."""
        if document_id is None:
            document_id = Path(file_path).stem
        
        text = self.extract_text(file_path)
        chunks = self.chunk_text(text)
        
        # Add metadata to chunks
        processed_chunks = []
        for i, chunk in enumerate(chunks):
            processed_chunks.append({
                'id': f"{document_id}_chunk_{i}",
                'document_id': document_id,
                'document_path': file_path,
                'chunk_index': i,
                'text': chunk['text'],
                'length': chunk['length']
            })
        
        return processed_chunks
