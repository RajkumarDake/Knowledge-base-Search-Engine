import requests
import json
from typing import Dict, List
from config import Config

class GroqLLMClient:
    """Client for interacting with Groq LLM API."""
    
    def __init__(self):
        self.config = Config()
        self.api_url = self.config.GROQ_API_URL
        self.api_key = self.config.GROQ_API_KEY
        self.model = self.config.GROQ_MODEL
        
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
    
    def generate_answer(self, query: str, context: str) -> Dict:
        """Generate an answer using the LLM with provided context."""
        
        # Create the prompt for RAG
        system_prompt = """You are a helpful AI assistant that answers questions based on provided documents. 
Use only the information from the provided context to answer the user's question. 
If the context doesn't contain enough information to answer the question, say so clearly.
Be concise but comprehensive in your response."""
        
        user_prompt = f"""Context from documents:
{context}

Question: {query}

Please provide a synthesized answer based on the context above."""

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
            "temperature": 0.3,
            "max_tokens": 1000
        }
        
        try:
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                answer = result['choices'][0]['message']['content']
                
                return {
                    "success": True,
                    "answer": answer,
                    "model": self.model,
                    "usage": result.get('usage', {})
                }
            else:
                return {
                    "success": False,
                    "error": f"API request failed with status {response.status_code}: {response.text}"
                }
                
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": "Request timed out"
            }
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": f"Request failed: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }
    
    def test_connection(self) -> Dict:
        """Test the connection to Groq API."""
        test_payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": "Hello, this is a test message."
                }
            ],
            "max_tokens": 50
        }
        
        try:
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=test_payload,
                timeout=10
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "message": "Connection to Groq API successful"
                }
            else:
                return {
                    "success": False,
                    "error": f"API test failed with status {response.status_code}: {response.text}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Connection test failed: {str(e)}"
            }
