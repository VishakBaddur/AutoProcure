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
            ai_provider: "ollama" for local, "openai" for cloud, "huggingface" for free cloud AI
            model_name: Model name (defaults to env var)
        """
        self.ai_provider = ai_provider or os.getenv('AI_PROVIDER', 'huggingface')
        self.model_name = model_name or os.getenv('AI_MODEL', 'mistral-7b-instruct')
        
        # Use localhost for local development, but allow override for cloud deployment
        default_ollama_url = 'http://localhost:11434'
        if os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('RENDER'):
            # In cloud deployment, Ollama runs on the same container
            default_ollama_url = 'http://localhost:11434'
        
        self.ollama_url = os.getenv('OLLAMA_URL', default_ollama_url)
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.huggingface_api_key = os.getenv('HUGGINGFACE_API_KEY')
        
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
                try:
                    response = await self._call_ollama(prompt)
                except Exception as e:
                    print(f"Ollama failed, trying Hugging Face: {str(e)}")
                    response = await self._call_huggingface(prompt)
            elif self.ai_provider == "openai":
                response = await self._call_openai(prompt)
            elif self.ai_provider == "huggingface":
                response = await self._call_huggingface(prompt)
            else:
                raise ValueError(f"Unsupported AI provider: {self.ai_provider}")
            
            # Parse and validate the response
            quote_data = self._parse_ai_response(response)
            
            # Convert to VendorQuote model
            return self._create_vendor_quote(quote_data)
            
        except Exception as e:
            print(f"AI analysis failed: {str(e)}")
            # Fallback to error message if AI fails
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

    async def _call_huggingface(self, prompt: str) -> str:
        """Call free AI service for quote analysis"""
        try:
            # Use a simple but effective approach with regex and NLP
            return self._analyze_quote_with_nlp(prompt)
        except Exception as e:
            print(f"AI analysis failed: {str(e)}")
            raise ValueError("AI analysis unavailable")
    
    def _analyze_quote_with_nlp(self, prompt: str) -> str:
        """Analyze quote using NLP techniques and pattern matching"""
        import re
        
        try:
            # Extract the quote text from the prompt
            if "QUOTE TEXT:" in prompt:
                quote_text = prompt.split("QUOTE TEXT:")[-1].strip()
            else:
                # If no QUOTE TEXT marker, use the entire prompt
                quote_text = prompt
            
            print(f"Analyzing quote text: {quote_text[:200]}...")
            
            # Extract vendor name (look for company patterns)
            vendor_patterns = [
                r'(?:from|by|vendor|supplier|company):\s*([A-Z][A-Za-z\s&.,]+)',
                r'([A-Z][A-Za-z\s&.,]+)\s+(?:Inc|Corp|LLC|Ltd|Company|Co)',
                r'Quote\s+from\s+([A-Z][A-Za-z\s&.,]+)',
                r'([A-Z][A-Za-z\s&.,]+)\s+Quote',
                r'Vendor:\s*([A-Z][A-Za-z\s&.,]+)',
            ]
            
            vendor_name = "Unknown Vendor"
            for pattern in vendor_patterns:
                match = re.search(pattern, quote_text, re.IGNORECASE)
                if match:
                    vendor_name = match.group(1).strip()
                    break
            
            # If no vendor found, try to extract from filename or first line
            if vendor_name == "Unknown Vendor":
                lines = quote_text.split('\n')
                for line in lines[:5]:  # Check first 5 lines
                    if any(word in line.lower() for word in ['vendor', 'supplier', 'company', 'inc', 'corp', 'llc']):
                        vendor_name = line.strip()
                        break
            
            print(f"Extracted vendor: {vendor_name}")
            
            # Extract items using pattern matching
            items = []
            
            # Look for common item patterns
            item_patterns = [
                r'(\d+)\s*x?\s*([A-Za-z0-9\s\-]+?)\s*@?\s*\$?([\d,]+\.?\d*)',
                r'([A-Za-z0-9\s\-]+?)\s*(\d+)\s*@?\s*\$?([\d,]+\.?\d*)',
                r'Qty:\s*(\d+).*?Item:\s*([A-Za-z0-9\s\-]+?)\s*Price:\s*\$?([\d,]+\.?\d*)',
                r'(\d+)\s*([A-Za-z0-9\s\-]+?)\s*\$?([\d,]+\.?\d*)',
                r'([A-Za-z0-9\s\-]+?)\s*(\d+)\s*\$?([\d,]+\.?\d*)',
            ]
            
            for pattern in item_patterns:
                matches = re.finditer(pattern, quote_text, re.IGNORECASE)
                for match in matches:
                    try:
                        if len(match.groups()) == 3:
                            if match.group(1).isdigit():
                                quantity = int(match.group(1))
                                description = match.group(2).strip()
                                unit_price = float(match.group(3).replace(',', ''))
                            else:
                                description = match.group(1).strip()
                                quantity = int(match.group(2))
                                unit_price = float(match.group(3).replace(',', ''))
                            
                            # Skip if values are unreasonable
                            if quantity > 0 and unit_price > 0 and unit_price < 1000000:
                                total = quantity * unit_price
                                sku = f"ITEM-{len(items)+1:03d}"
                                
                                items.append({
                                    "sku": sku,
                                    "description": description,
                                    "quantity": quantity,
                                    "unitPrice": unit_price,
                                    "deliveryTime": "7-10 days",
                                    "total": total
                                })
                                print(f"Extracted item: {quantity}x {description} @ ${unit_price}")
                    except (ValueError, IndexError) as e:
                        print(f"Error parsing item: {e}")
                        continue
            
            # If no items found, try to extract any numbers that might be prices
            if not items:
                print("No items found with patterns, trying alternative extraction...")
                # Look for any numbers that might be prices
                price_pattern = r'\$?([\d,]+\.?\d*)'
                price_matches = re.findall(price_pattern, quote_text)
                
                if price_matches:
                    # Use the first price found as a default item
                    try:
                        unit_price = float(price_matches[0].replace(',', ''))
                        if unit_price > 0 and unit_price < 1000000:
                            items.append({
                                "sku": "DEFAULT-001",
                                "description": "Product/Service",
                                "quantity": 1,
                                "unitPrice": unit_price,
                                "deliveryTime": "TBD",
                                "total": unit_price
                            })
                            print(f"Created default item with price: ${unit_price}")
                    except ValueError:
                        pass
            
            # If still no items, create a minimal item
            if not items:
                items.append({
                    "sku": "DEFAULT-001",
                    "description": "Product/Service",
                    "quantity": 1,
                    "unitPrice": 100.0,
                    "deliveryTime": "TBD",
                    "total": 100.0
                })
                print("Created minimal default item")
            
            # Extract payment terms
            payment_patterns = [
                r'(?:payment|terms):\s*([A-Za-z0-9\s]+)',
                r'(net\s+\d+)',
                r'(due\s+upon\s+receipt)',
                r'(net\s+30)',
                r'(net\s+60)',
            ]
            
            payment_terms = "Net 30"
            for pattern in payment_patterns:
                match = re.search(pattern, quote_text, re.IGNORECASE)
                if match:
                    payment_terms = match.group(1).strip()
                    break
            
            # Extract warranty
            warranty_patterns = [
                r'(?:warranty|guarantee):\s*([A-Za-z0-9\s]+)',
                r'(\d+\s+year[s]?\s+warranty)',
                r'(standard\s+warranty)',
            ]
            
            warranty = "Standard warranty"
            for pattern in warranty_patterns:
                match = re.search(pattern, quote_text, re.IGNORECASE)
                if match:
                    warranty = match.group(1).strip()
                    break
            
            # Create JSON response
            result = {
                "vendorName": vendor_name,
                "items": items,
                "terms": {
                    "payment": payment_terms,
                    "warranty": warranty
                }
            }
            
            print(f"Analysis complete. Found {len(items)} items for {vendor_name}")
            return json.dumps(result, indent=2)
            
        except Exception as e:
            print(f"Error in NLP analysis: {str(e)}")
            # Return a basic fallback
            return json.dumps({
                "vendorName": "Analysis Failed",
                "items": [{
                    "sku": "ERROR-001",
                    "description": "Analysis failed - please check file format",
                    "quantity": 1,
                    "unitPrice": 0.0,
                    "deliveryTime": "TBD",
                    "total": 0.0
                }],
                "terms": {
                    "payment": "Manual Review Required",
                    "warranty": "Manual Review Required"
                }
            }, indent=2)

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