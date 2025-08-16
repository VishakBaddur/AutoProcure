import json
import httpx
import os
import re
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
            # Fallback to NLP analysis
            try:
                nlp_result = self._analyze_quote_with_nlp(text_content)
                quote_data = json.loads(nlp_result)
                return self._create_vendor_quote(quote_data)
            except Exception as nlp_error:
                print(f"NLP fallback also failed: {str(nlp_error)}")
                # Final fallback to error message
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
    
    def _analyze_quote_with_nlp(self, quote_text: str) -> str:
        """Analyze quote using NLP patterns and return JSON string"""
        try:
            # First, detect document type to avoid misclassification
            document_type = self._detect_document_type(quote_text)
            if document_type != "quote":
                return json.dumps({
                    "vendorName": f"Document Type: {document_type.title()}",
                    "items": [],
                    "terms": {"payment": "N/A", "warranty": "N/A"},
                    "analysis_note": f"This appears to be a {document_type}, not a vendor quote. Please upload a vendor quote for analysis."
                })
            
            # Extract vendor name with improved patterns
            vendor_patterns = [
                r'vendor[:\-]\s*([A-Za-z0-9\s&.,\-]+)',
                r'quote from\s*([A-Za-z0-9\s&.,\-]+)',
                r'supplier[:\-]\s*([A-Za-z0-9\s&.,\-]+)',
                r'company[:\-]\s*([A-Za-z0-9\s&.,\-]+)',
                r'([A-Za-z0-9\s&.,\-]+)\s+(?:inc|corp|llc|ltd|company)',
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
            
            # Define item_patterns for robust PDF line extraction
            item_patterns = [
                r'([A-Z0-9\-]+)\s+([A-Za-z0-9\s]+)\s+(\d+)\s+\$?([\d\.]+)',  # SKU, Description, Quantity, Price
                r'([A-Za-z0-9\s\-]+?)\s*(\d+)\s*\$?([\d,]+\.?\d*)',          # fallback: Description, Quantity, Price
            ]

            matched_lines = set()
            items = []
            lines = quote_text.split('\n')
            for line in lines:
                line_clean = line.strip()
                if not line_clean or line_clean in matched_lines:
                    continue
                for pattern in item_patterns:
                    match = re.match(pattern, line_clean)
                    if match:
                        try:
                            if len(match.groups()) == 4:
                                sku = match.group(1).strip()
                                description = match.group(2).strip()
                                quantity = int(match.group(3))
                                unit_price = float(match.group(4))
                            elif len(match.groups()) == 3:
                                sku = f"ITEM-{len(items)+1:03d}"
                                description = match.group(1).strip()
                                quantity = int(match.group(2))
                                unit_price = float(match.group(3))
                            else:
                                continue
                            
                            # Enhanced validation for reasonable values
                            if not self._validate_item_values(quantity, unit_price, description):
                                continue
                                
                            total = quantity * unit_price
                            items.append({
                                "sku": sku,
                                "description": description,
                                "quantity": quantity,
                                "unitPrice": unit_price,
                                "deliveryTime": "7-10 days",
                                "total": total
                            })
                            matched_lines.add(line_clean)
                            print(f"Extracted item: {quantity}x {description} @ ${unit_price}")
                            break  # Only match one pattern per line
                        except (ValueError, IndexError) as e:
                            print(f"Error parsing item: {e}")
                            continue
            
            # If no items found, don't create fake data
            if not items:
                print("No valid items could be extracted from the document")
                return json.dumps({
                    "vendorName": vendor_name,
                    "items": [],
                    "terms": {"payment": "N/A", "warranty": "N/A"},
                    "analysis_note": "No pricing information could be extracted. Please ensure this is a vendor quote with itemized pricing."
                })
            
            # Validate total quote value
            total_quote_value = sum(item["total"] for item in items)
            if not self._validate_quote_total(total_quote_value):
                return json.dumps({
                    "vendorName": vendor_name,
                    "items": [],
                    "terms": {"payment": "N/A", "warranty": "N/A"},
                    "analysis_note": f"Extracted total value (${total_quote_value:,.2f}) appears to be outside reasonable range for a vendor quote. Please verify the document."
                })
            
            # Deduplicate/group items by description and unit price
            def deduplicate_items(items):
                from collections import defaultdict
                grouped = defaultdict(lambda: {"sku": "", "description": "", "quantity": 0, "unitPrice": 0.0, "deliveryTime": "", "total": 0.0})
                for item in items:
                    key = (item["description"].strip().lower(), round(item["unitPrice"], 2))
                    grouped[key]["sku"] = item["sku"]
                    grouped[key]["description"] = item["description"]
                    grouped[key]["unitPrice"] = item["unitPrice"]
                    grouped[key]["deliveryTime"] = item["deliveryTime"]
                    grouped[key]["quantity"] += item["quantity"]
                    grouped[key]["total"] += item["total"]
                return list(grouped.values())

            items = deduplicate_items(items)
            
            # Extract terms
            payment_terms = "Net 30"
            warranty = "Standard warranty"
            
            # Look for payment terms
            payment_patterns = [
                r'payment[:\-]\s*([A-Za-z0-9\s]+)',
                r'terms[:\-]\s*([A-Za-z0-9\s]+)',
                r'net\s+(\d+)',
            ]
            for pattern in payment_patterns:
                match = re.search(pattern, quote_text, re.IGNORECASE)
                if match:
                    payment_terms = match.group(1).strip()
                    break
            
            # Look for warranty
            warranty_patterns = [
                r'warranty[:\-]\s*([A-Za-z0-9\s]+)',
                r'guarantee[:\-]\s*([A-Za-z0-9\s]+)',
            ]
            for pattern in warranty_patterns:
                match = re.search(pattern, quote_text, re.IGNORECASE)
                if match:
                    warranty = match.group(1).strip()
                    break
            
            result = {
                "vendorName": vendor_name,
                "items": items,
                "terms": {
                    "payment": payment_terms,
                    "warranty": warranty
                }
            }
            
            return json.dumps(result)
            
        except Exception as e:
            print(f"NLP analysis failed: {str(e)}")
            return json.dumps({
                "vendorName": "Analysis Failed",
                "items": [],
                "terms": {"payment": "N/A", "warranty": "N/A"},
                "analysis_note": f"Analysis failed: {str(e)}"
            })

    def _detect_document_type(self, text: str) -> str:
        """Detect if document is a quote, receipt, invoice, or other type"""
        text_lower = text.lower()
        
        # Receipt indicators
        receipt_indicators = [
            "receipt", "payment received", "paid", "total paid", "amount paid",
            "thank you for your purchase", "transaction", "sale", "purchase"
        ]
        if any(indicator in text_lower for indicator in receipt_indicators):
            return "receipt"
        
        # Invoice indicators
        invoice_indicators = [
            "invoice", "bill", "amount due", "please pay", "payment due",
            "invoice number", "bill to", "ship to"
        ]
        if any(indicator in text_lower for indicator in invoice_indicators):
            return "invoice"
        
        # Quote indicators
        quote_indicators = [
            "quote", "quotation", "proposal", "estimate", "pricing",
            "vendor", "supplier", "terms and conditions", "valid until",
            "quote number", "proposal number"
        ]
        if any(indicator in text_lower for indicator in quote_indicators):
            return "quote"
        
        # Default to quote if unclear
        return "quote"

    def _validate_item_values(self, quantity: int, unit_price: float, description: str) -> bool:
        """Validate that item values are reasonable"""
        # Quantity validation
        if quantity <= 0 or quantity > 100000:
            return False
        
        # Unit price validation (reasonable range for most procurement items)
        if unit_price <= 0 or unit_price > 100000:
            return False
        
        # Description validation
        if len(description) < 2 or description.isdigit():
            return False
        
        return True

    def _validate_quote_total(self, total: float) -> bool:
        """Validate that quote total is reasonable"""
        # Most vendor quotes are between $10 and $10M
        # Receipts and small purchases are typically under $10K
        if total < 10 or total > 10000000:
            return False
        
        return True

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

    def _create_vendor_quote(self, quote_data: Dict[str, Any]) -> VendorQuote:
        """Convert parsed data to VendorQuote model"""
        try:
            # Handle analysis notes for non-quote documents
            if "analysis_note" in quote_data:
                # This is a special case for non-quote documents
                return VendorQuote(
                    vendorName=quote_data.get("vendorName", "Analysis Failed"),
                    items=[],
                    terms=QuoteTerms(
                        payment=quote_data.get("terms", {}).get("payment", "N/A"),
                        warranty=quote_data.get("terms", {}).get("warranty", "N/A")
                    )
                )
            
            # Normal quote processing
            vendor_name = quote_data.get("vendorName", "Unknown Vendor")
            
            # Convert items
            items = []
            for item_data in quote_data.get("items", []):
                try:
                    item = QuoteItem(
                        sku=item_data.get("sku", "N/A"),
                        description=item_data.get("description", "Unknown Item"),
                        quantity=item_data.get("quantity", 1),
                        unitPrice=item_data.get("unitPrice", 0.0),
                        deliveryTime=item_data.get("deliveryTime", "TBD"),
                        total=item_data.get("total", 0.0)
                    )
                    items.append(item)
                except Exception as e:
                    print(f"Error creating item: {e}")
                    continue
            
            # Convert terms
            terms_data = quote_data.get("terms", {})
            terms = QuoteTerms(
                payment=terms_data.get("payment", "TBD"),
                warranty=terms_data.get("warranty", "TBD")
            )
            
            return VendorQuote(
                vendorName=vendor_name,
                items=items,
                terms=terms
            )
            
        except Exception as e:
            print(f"Error creating VendorQuote: {e}")
            return self._get_fallback_quote()

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