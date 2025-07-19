import json
import httpx
import os
from dotenv import load_dotenv
from typing import Dict, Any, Optional
from .models import VendorQuote, QuoteItem, QuoteTerms

# Load environment variables
load_dotenv()

class AIProcessor:
    def __init__(self, ai_provider: str = None, model_name: str = None):
        """
        Initialize AI processor
        
        Args:
            ai_provider: "ollama" for local, "openai" for cloud (defaults to env var)
            model_name: Model name (defaults to env var)
        """
        self.ai_provider = ai_provider or os.getenv('AI_PROVIDER', 'ollama')
        self.model_name = model_name or os.getenv('AI_MODEL', 'mistral')
        
        # Use localhost for local development, but allow override for cloud deployment
        default_ollama_url = 'http://localhost:11434'
        if os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('RENDER'):
            # In cloud deployment, Ollama runs on the same container
            default_ollama_url = 'http://localhost:11434'
        
        self.ollama_url = os.getenv('OLLAMA_URL', default_ollama_url)
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        
        print(f"🤖 AI Processor initialized: {self.ai_provider} with model {self.model_name}")
        print(f"🔗 Ollama URL: {self.ollama_url}")
        
    async def analyze_quote(self, text_content: str, rag_context: str = None) -> VendorQuote:
        """
        Analyze quote text and extract structured data using AI
        Optionally augment with RAG context.
        """
        try:
            # Create the prompt for quote analysis
            prompt = self._create_analysis_prompt(text_content, rag_context)
            
            # Get AI response
            if self.ai_provider == "ollama":
                response = await self._call_ollama(prompt)
            elif self.ai_provider == "openai":
                response = await self._call_openai(prompt)
            else:
                raise ValueError(f"Unsupported AI provider: {self.ai_provider}")
            
            # Parse and validate the response
            quote_data = self._parse_ai_response(response)
            
            # Convert to VendorQuote model
            return self._create_vendor_quote(quote_data)
            
        except Exception as e:
            print(f"AI analysis failed: {str(e)}")
            # Fallback to mock data if AI fails
            return self._get_fallback_quote()
    
    def _create_analysis_prompt(self, text_content: str, rag_context: str = None) -> str:
        """Create a detailed prompt for quote analysis, optionally with RAG context."""
        context_section = f"""
RELEVANT PAST QUOTES AND CONTEXT:
{rag_context}
""" if rag_context else ""
        return f"""You are an expert procurement analyst. Analyze the following vendor quote and extract structured information.
{context_section}
QUOTE TEXT:
{text_content}

Extract the following information and return ONLY a valid JSON object:

{{
  "vendorName": "Company name",
  "items": [
    {{
      "sku": "Product SKU or code",
      "description": "Product description",
      "quantity": 100,
      "unitPrice": 10.50,
      "deliveryTime": "7 days",
      "total": 1050.00
    }}
  ],
  "terms": {{
    "payment": "Payment terms (e.g., Net 30)",
    "warranty": "Warranty information"
  }}
}}

IMPORTANT RULES:
1. Use the context above to inform your analysis and recommendations.
2. Return ONLY the JSON object, no other text
3. If information is missing, use reasonable defaults
4. Ensure all numbers are valid (no negative values)
5. Calculate total as quantity × unitPrice
6. Extract vendor name from the document
7. Look for payment terms and warranty information
8. If multiple items exist, include all of them

JSON Response:"""

    async def _call_ollama(self, prompt: str) -> str:
        """Call Ollama API"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.model_name,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.1,  # Low temperature for consistent output
                            "top_p": 0.9
                        }
                    }
                )
                response.raise_for_status()
                result = response.json()
                return result.get("response", "")
        except Exception as e:
            print(f"Ollama API call failed: {str(e)}")
            # Return a fallback response if Ollama fails
            return self._get_fallback_response(prompt)
    
    def _get_fallback_response(self, prompt: str) -> str:
        """Return a fallback response when Ollama is not available"""
        print("⚠️ Using fallback response - Ollama model not available")
        return '''{
  "vendorName": "Sample Vendor Corp",
  "items": [
    {
      "sku": "SAMPLE-001",
      "description": "Sample Product",
      "quantity": 100,
      "unitPrice": 25.00,
      "deliveryTime": "7-10 business days",
      "total": 2500.00
    }
  ],
  "terms": {
    "payment": "Net 30",
    "warranty": "1 year standard warranty"
  }
}'''

    async def _call_openai(self, prompt: str) -> str:
        """Call OpenAI API"""
        if not self.openai_api_key:
            raise ValueError("OpenAI API key not configured")
            
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openai_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model_name,
                        "messages": [
                            {"role": "system", "content": "You are an expert procurement analyst. Extract structured data from vendor quotes."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.1,
                        "max_tokens": 2000
                    }
                )
                response.raise_for_status()
                result = response.json()
                return result["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"OpenAI API call failed: {str(e)}")
            raise

    def _parse_ai_response(self, response: str) -> Dict[str, Any]:
        """Parse AI response and extract JSON"""
        try:
            # Clean the response - extract JSON from the text
            response = response.strip()
            
            # Find JSON object in the response
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                raise ValueError("No JSON object found in response")
                
            json_str = response[start_idx:end_idx]
            return json.loads(json_str)
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing failed: {str(e)}")
            print(f"Raw response: {response}")
            raise ValueError(f"Invalid JSON response: {str(e)}")

    def _create_vendor_quote(self, data: Dict[str, Any]) -> VendorQuote:
        """Convert parsed data to VendorQuote model"""
        try:
            # Validate and create items
            items = []
            for item_data in data.get("items", []):
                item = QuoteItem(
                    sku=item_data.get("sku", "UNKNOWN"),
                    description=item_data.get("description", "Unknown Product"),
                    quantity=int(item_data.get("quantity", 0)),
                    unitPrice=float(item_data.get("unitPrice", 0.0)),
                    deliveryTime=item_data.get("deliveryTime", "TBD"),
                    total=float(item_data.get("total", 0.0))
                )
                items.append(item)
            
            # Create terms
            terms = QuoteTerms(
                payment=data.get("terms", {}).get("payment", "TBD"),
                warranty=data.get("terms", {}).get("warranty", "TBD")
            )
            
            # Create vendor quote
            return VendorQuote(
                vendorName=data.get("vendorName", "Unknown Vendor"),
                items=items,
                terms=terms
            )
            
        except Exception as e:
            print(f"Error creating VendorQuote: {str(e)}")
            raise

    def _get_fallback_quote(self) -> VendorQuote:
        """Fallback quote when AI analysis fails"""
        return VendorQuote(
            vendorName="Analysis Failed - Manual Review Required",
            items=[
                QuoteItem(
                    sku="REVIEW_REQUIRED",
                    description="Please manually review the uploaded document",
                    quantity=1,
                    unitPrice=0.0,
                    deliveryTime="TBD",
                    total=0.0
                )
            ],
            terms=QuoteTerms(
                payment="Manual Review Required",
                warranty="Manual Review Required"
            )
        )

# Global AI processor instance
ai_processor = AIProcessor() 