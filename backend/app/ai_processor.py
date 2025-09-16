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
        # Use NLP-only approach for reliability and deployment compatibility
        self.ai_provider = ai_provider or os.getenv('AI_PROVIDER', 'nlp')
        self.model_name = model_name or os.getenv('AI_MODEL', 'nlp-pattern-matching')
        
        # Currency conversion setup
        self.base_currency = os.getenv('BASE_CURRENCY', 'USD')
        self.exchange_rates = {
            'USD': 1.0,
            'EUR': 0.85,  # Will be updated with real-time rates
            'GBP': 0.73,
            'CAD': 1.25,
            'AUD': 1.35,
            'JPY': 110.0,
            'INR': 75.0,
            'CNY': 6.5
        }
        
        print(f"🤖 AI Processor initialized: {self.ai_provider} with model {self.model_name}")
        print(f"💰 Base currency: {self.base_currency}")
        
    async def analyze_quote(self, text_content: str, rag_context: str = None, filename: str = "") -> VendorQuote:
        """
        Analyze quote text and extract structured data using NLP patterns
        Optionally augment with RAG context and filename for vendor extraction.
        """
        try:
            print(f"[AI ANALYSIS] Starting analysis of text (length: {len(text_content)})")
            print(f"[AI ANALYSIS] Text preview: {text_content[:200]}...")
            print(f"[AI ANALYSIS] Filename: {filename}")
            
            # Use NLP analysis directly (no external APIs needed)
            print(f"[AI ANALYSIS] Using NLP pattern matching")
            nlp_result = self._analyze_quote_with_nlp(text_content, filename)
            quote_data = json.loads(nlp_result)
            
            print(f"[AI ANALYSIS] NLP result: {json.dumps(quote_data, indent=2)}")
            
            # Convert to VendorQuote model
            return self._create_vendor_quote(quote_data)
            
        except Exception as e:
            print(f"NLP analysis failed: {str(e)}")
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
    
    def _analyze_quote_with_nlp(self, quote_text: str, filename: str = "") -> str:
        """Analyze quote using NLP patterns and return JSON string"""
        try:
            # Clean the text first
            quote_text = self._clean_quote_text(quote_text)
            
            # First, detect document type to avoid misclassification
            document_type = self._detect_document_type(quote_text)
            if document_type != "quote":
                return json.dumps({
                    "vendorName": f"Document Type: {document_type.title()}",
                    "items": [],
                    "terms": {"payment": "N/A", "warranty": "N/A"},
                    "analysis_note": f"This appears to be a {document_type}, not a vendor quote. Please upload a vendor quote for analysis."
                })
            
            # Extract vendor name with improved patterns and filename fallback
            vendor_name = self._extract_vendor_name(quote_text, filename)
            
            # Detect currency and convert if needed
            detected_currency = self._detect_currency(quote_text)
            print(f"Detected currency: {detected_currency}")
            
            # Extract items with better patterns
            items = self._extract_items(quote_text)
            
            # Convert currency if needed
            if detected_currency and detected_currency != self.base_currency:
                items = self._convert_currency(items, detected_currency)
                print(f"Converted items from {detected_currency} to {self.base_currency}")
            
            # If no items found, don't create fake data
            if not items:
                print("No valid items could be extracted from the document")
                return json.dumps({
                    "vendorName": vendor_name,
                    "items": [],
                    "terms": {"payment": "N/A", "warranty": "N/A"},
                    "analysis_note": "No pricing information could be extracted. Please ensure this is a vendor quote with itemized pricing."
                })
            
            # Collect major corrections from items
            major_corrections = []
            for item in items:
                if "correction_info" in item:
                    major_corrections.append(item["correction_info"])
                    # Remove correction_info from the item to keep it clean
                    del item["correction_info"]
            
            # Extract terms
            terms = self._extract_terms(quote_text)
            
            # Create the final result
            result = {
                "vendorName": vendor_name,
                "items": items,
                "terms": terms
            }
            
            # Add major corrections if any
            if major_corrections:
                result["major_corrections"] = major_corrections
            
            return json.dumps(result, indent=2)
            
        except Exception as e:
            print(f"NLP analysis failed: {str(e)}")
            return json.dumps({
                "vendorName": "Unknown Vendor",
                "items": [],
                "terms": {"payment": "N/A", "warranty": "N/A"},
                "analysis_note": f"Analysis failed: {str(e)}"
            })
    
    def _clean_quote_text(self, text: str) -> str:
        """Clean and normalize quote text"""
        # Remove common instruction text that might be mixed in
        instruction_patterns = [
            r'unitPrice\s+\d+\.\s*Extract vendor name.*?',
            r'Look for payment terms.*?',
            r'If multiple items exist.*?',
            r'Choose.*?recommendation.*?',
            r'Extract.*?from the document.*?',
        ]
        
        for pattern in instruction_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
        
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        
        return text
    
    def _extract_vendor_name(self, text: str, filename: str = "") -> str:
        """Extract vendor name with improved patterns and filename fallback"""
        # First, try to extract from filename if provided
        if filename:
            # Extract vendor name from filename (e.g., "vendor_a_quote.pdf" -> "Vendor A")
            filename_vendor = self._extract_vendor_from_filename(filename)
            if filename_vendor and filename_vendor != "Unknown":
                print(f"Using vendor name from filename: {filename_vendor}")
                return filename_vendor
        
        # Then try text-based extraction with more specific patterns
        vendor_patterns = [
            # Specific quote patterns
            r'([A-Za-z0-9\s&.,\-]+)\s+Quote',
            r'Quote\s+([A-Za-z0-9\s&.,\-]+)',
            # Company identifier patterns
            r'([A-Za-z0-9\s&.,\-]+)\s+(?:Inc|Corp|LLC|Ltd|Company|Pvt|Co)',
            r'([A-Za-z0-9\s&.,\-]+)\s+(?:Supplies|Office|Solutions|Systems)',
            # Document header patterns
            r'^([A-Za-z0-9\s&.,\-]+)\s*$',  # First line as vendor name
            r'^([A-Za-z0-9\s&.,\-]+)\s+Date',  # First line with date
        ]
        
        vendor_name = "Unknown Vendor"
        for pattern in vendor_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                candidate = match.group(1).strip()
                # Validate the extracted name
                if self._is_valid_vendor_name(candidate):
                    vendor_name = candidate
                    break
        
        # If still no valid vendor, try first meaningful line
        if vendor_name == "Unknown Vendor":
            lines = text.split('\n')
            for line in lines[:3]:  # Check first 3 lines
                line_clean = line.strip()
                if line_clean and len(line_clean) > 3 and self._is_valid_vendor_name(line_clean):
                    vendor_name = line_clean
                    break
        
        # Final cleanup and validation
        vendor_name = vendor_name.strip()
        if not self._is_valid_vendor_name(vendor_name):
            vendor_name = "Unknown Vendor"
        
        if len(vendor_name) > 50:  # If too long, truncate
            vendor_name = vendor_name[:50] + "..."
        
        print(f"Extracted vendor: {vendor_name}")
        return vendor_name
    
    def _extract_vendor_from_filename(self, filename: str) -> str:
        """Extract vendor name from filename"""
        try:
            # Remove extension
            name = filename.rsplit('.', 1)[0]
            
            # Common patterns in filenames
            patterns = [
                r'vendor_([a-z_]+)',  # vendor_a_quote -> Vendor A
                r'([a-z_]+)_quote',   # abc_supplies_quote -> Abc Supplies
                r'([a-z_]+)_proposal', # xyz_proposal -> Xyz
                r'([a-z_]+)_bid',     # company_bid -> Company
            ]
            
            for pattern in patterns:
                match = re.search(pattern, name.lower())
                if match:
                    vendor_part = match.group(1)
                    # Convert to readable format
                    vendor_name = vendor_part.replace('_', ' ').title()
                    # Clean up common words
                    vendor_name = re.sub(r'\b(Quote|Proposal|Bid|Vendor)\b', '', vendor_name, flags=re.IGNORECASE).strip()
                    if vendor_name:
                        return vendor_name
            
            return "Unknown"
        except Exception as e:
            print(f"Error extracting vendor from filename: {e}")
            return "Unknown"
    
    def _is_valid_vendor_name(self, name: str) -> bool:
        """Validate if extracted text looks like a vendor name"""
        if not name or len(name) < 2:
            return False
        
        # Skip common non-vendor text
        skip_patterns = [
            r'^\d+$',  # Just numbers
            r'^[A-Za-z\s]+$',  # Just letters and spaces (too generic)
            r'extract', r'look for', r'choose', r'recommendation',
            r'unitprice', r'vendor', r'supplier', r'quote', r'total',
            r'date', r'time', r'payment', r'warranty'
        ]
        
        for pattern in skip_patterns:
            if re.search(pattern, name, re.IGNORECASE):
                return False
        
        # Must have some meaningful content
        if len(name.strip()) < 3:
            return False
        
        return True
    
    def _extract_items(self, text: str) -> list:
        """Extract items with intelligent parsing for any file format"""
        print("Starting intelligent extraction...")
        print(f"Text length: {len(text)}")
        print(f"Text preview: {text[:200]}...")
        items = self._intelligent_item_extraction(text)
        
        if items:
            print(f"Intelligent extraction found {len(items)} items")
            return items
        
        print("Intelligent extraction failed, trying pattern matching...")
        lines = text.split('\n')
        item_patterns = [
            # Text file pattern: "Item: Description - $Price x Quantity = $Total"
            r'Item:\s*([A-Za-z0-9\s\-]+?)\s*-\s*\$?([\d,]+\.?\d*)\s*x\s*(\d+)\s*=\s*\$?([\d,]+\.?\d*)',
            # Alternative text file pattern: "Item: Description - Quantity x $Price = $Total"
            r'Item:\s*([A-Za-z0-9\s\-]+?)\s*-\s*(\d+)\s*x\s*\$?([\d,]+\.?\d*)\s*=\s*\$?([\d,]+\.?\d*)',
            # Real-world patterns from actual PDFs
            r'([A-Za-z0-9\s\-]+?)\s*-\s*\$?([\d,]+\.?\d*)\s*x\s*(\d+)\s*=\s*\$?([\d,]+\.?\d*)',
            r'([A-Za-z0-9\s\-]+?)\s*-\s*(\d+)\s*x\s*\$?([\d,]+\.?\d*)\s*=\s*\$?([\d,]+\.?\d*)',
            r'([A-Za-z0-9\s\-]+?)\s*\$?([\d,]+\.?\d*)\s*x\s*(\d+)\s*\$?([\d,]+\.?\d*)',
            r'([A-Za-z0-9\s\-]+?)\s*(\d+)\s*x\s*\$?([\d,]+\.?\d*)\s*\$?([\d,]+\.?\d*)',
            # Standard patterns
            r'([A-Z0-9\-]+)\s+([A-Za-z0-9\s\-]+?)\s+(\d+)\s+\$?([\d,]+\.?\d*)',
            r'([A-Za-z0-9\s\-]+?)\s+(\d+)\s+\$?([\d,]+\.?\d*)',
            r'([A-Za-z0-9\s\-]+?)\s*-\s*(\d+)\s*x\s*\$?([\d,]+\.?\d*)',
            r'([A-Za-z0-9\s\-]+?)\s*:\s*(\d+)\s*@\s*\$?([\d,]+\.?\d*)',
            # Simple patterns for messy data
            r'([A-Za-z0-9\s\-]+?)\s+\$?([\d,]+\.?\d*)\s*$',
            # Very loose patterns for extremely messy data
            r'([A-Za-z0-9\s\-]{3,}?)\s*\$?([\d,]+\.?\d*)',
        ]
        
        matched_lines = set()
        
        for line in lines:
            line_clean = line.strip()
            if not line_clean or line_clean in matched_lines:
                continue
                
            # Skip lines that look like instructions, headers, or metadata
            skip_words = ['extract', 'look for', 'choose', 'recommendation', 'unitprice', 'vendor', 'supplier', 'quote', 'total', 'subtotal']
            if any(skip_word in line_clean.lower() for skip_word in skip_words):
                continue
                
            # Skip lines that are too short or too long
            if len(line_clean) < 5 or len(line_clean) > 200:
                continue
                
            for pattern in item_patterns:
                match = re.search(pattern, line_clean, re.IGNORECASE)
                if match:
                    try:
                        groups = match.groups()
                        
                        if len(groups) == 4:
                            # Check if it's the new "Item: Description - Price x Qty = Total" format
                            if 'Item:' in line_clean:
                                # Format: Item: Description - Price x Qty = Total
                                description = groups[0].strip()
                                unit_price = float(groups[1].replace(',', ''))
                                quantity = int(groups[2])
                                total = float(groups[3].replace(',', ''))
                                sku = f"ITEM-{len(items)+1:03d}"
                            else:
                                # Format: SKU Description Qty Price
                                sku = groups[0].strip()
                                description = groups[1].strip()
                                quantity = int(groups[2])
                                unit_price = float(groups[3].replace(',', ''))
                                total = quantity * unit_price
                        elif len(groups) == 3:  # Description Qty Price
                            sku = f"ITEM-{len(items)+1:03d}"
                            description = groups[0].strip()
                            quantity = int(groups[1])
                            unit_price = float(groups[2].replace(',', ''))
                            total = quantity * unit_price
                        elif len(groups) == 2:  # Description Price (assume qty=1)
                            sku = f"ITEM-{len(items)+1:03d}"
                            description = groups[0].strip()
                            quantity = 1
                            unit_price = float(groups[1].replace(',', ''))
                            total = quantity * unit_price
                        else:
                            continue
                        
                        # Enhanced validation for reasonable values
                        if not self._validate_item_values(quantity, unit_price, description):
                            continue
                            
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
        
        # Always try intelligent extraction as the primary method
        if not items:
            print("No items found with patterns, trying intelligent extraction...")
            items = self._intelligent_item_extraction(text)
        
        # If still no items, try intelligent extraction on the entire text
        if not items:
            print("Trying intelligent extraction on full text...")
            items = self._intelligent_item_extraction(text)
        
        # If intelligent extraction found items, return them immediately
        if items:
            print(f"Intelligent extraction successful, found {len(items)} items")
            return items
        
        # Deduplicate/group items by description and unit price
        items = self._deduplicate_items(items)
        
        return items
    
    def _intelligent_item_extraction(self, text: str) -> list:
        """Intelligent extraction that can handle ANY format without specific patterns"""
        print(f"Intelligent extraction called with text length: {len(text)}")
        print(f"Intelligent extraction text preview: {text[:100]}...")
        items = []
        lines = text.split('\n')
        
        # Handle both multi-line and single-line text
        if len(lines) == 1 and len(lines[0]) > 200:
            # Single long line - split by common item patterns
            print("Detected single long line, splitting by item patterns...")
            text_clean = lines[0]
            
            # Split by "Item:" patterns
            item_sections = re.split(r'Item:\s*', text_clean)
            if len(item_sections) > 1:
                for i, section in enumerate(item_sections[1:], 1):  # Skip first empty section
                    line_clean = f"Item: {section.strip()}"
                    print(f"Processing item section: '{line_clean[:100]}...'")
                    
                    # Skip obvious non-item lines (but allow lines that contain item information)
                    skip_words = ['vendor', 'supplier', 'quote', 'total', 'subtotal', 'date', 'payment', 'delivery', 'terms']
                    # Only skip if the line ONLY contains skip words, not if it contains both skip words AND item info
                    if any(word in line_clean.lower() for word in skip_words) and not any(word in line_clean.lower() for word in ['item', 'quantity', 'price', 'sku', 'description']):
                        print(f"Skipping item section (only contains skip words): '{line_clean[:50]}...'")
                        continue
                        
                    # Process this item section
                    if '$' in line_clean and any(char.isdigit() for char in line_clean):
                        try:
                            # Extract ALL currency amounts
                            currency_amounts = re.findall(r'\$?([\d,]+\.?\d*)', line_clean)
                            if not currency_amounts:
                                continue
                            
                            # Intelligent parsing based on number of values found
                            if len(currency_amounts) >= 2:
                                # Look for the "x" format: $price x quantity = $total
                                x_format_match = re.search(r'\$?([\d,]+\.?\d*)\s*x\s*(\d+)\s*=\s*\$?([\d,]+\.?\d*)', line_clean)
                                if x_format_match:
                                    unit_price = float(x_format_match.group(1).replace(',', ''))
                                    quantity = int(x_format_match.group(2))
                                    total_price = float(x_format_match.group(3).replace(',', ''))
                                else:
                                    # Fallback: assume first and last currency amounts
                                    unit_price = float(currency_amounts[0].replace(',', ''))
                                    total_price = float(currency_amounts[-1].replace(',', ''))
                                    
                                    # Calculate quantity if reasonable
                                    quantity = 1
                                    if unit_price > 0:
                                        calculated_qty = total_price / unit_price
                                        if 0.1 <= calculated_qty <= 10000:  # Reasonable range
                                            quantity = calculated_qty
                                
                                # Extract description (everything before first $)
                                first_dollar = line_clean.find('$')
                                if first_dollar > 0:
                                    description = line_clean[:first_dollar].strip()
                                    
                                    # Clean up description
                                    description = re.sub(r'^[A-Za-z]+:\s*', '', description)  # Remove "Item:" prefix
                                    description = description.strip()
                                    
                                    if len(description) >= 3:
                                        items.append({
                                            "sku": f"ITEM-{len(items)+1:03d}",
                                            "description": description,
                                            "quantity": quantity,
                                            "unitPrice": unit_price,
                                            "deliveryTime": "7-10 days",
                                            "total": total_price
                                        })
                                        # Clean up trailing dashes and extra whitespace
                                        description = re.sub(r'\s*-\s*$', '', description)
                                        description = description.strip()
                                        print(f"Intelligent extraction: {quantity}x {description} @ ${unit_price} = ${total_price}")
                        
                        except Exception as e:
                            print(f"Intelligent extraction error: {e}")
                            continue
        else:
            # Normal multi-line processing
            for line in lines:
                line_clean = line.strip()
                if not line_clean or len(line_clean) < 5:
                    continue
                    
                print(f"Processing line: '{line_clean}'")
                    
                # Skip obvious non-item lines (but allow lines that contain item information)
                skip_words = ['vendor', 'supplier', 'quote', 'total', 'subtotal', 'date', 'payment', 'delivery', 'terms']
                # Only skip if the line ONLY contains skip words, not if it contains both skip words AND item info
                if any(word in line_clean.lower() for word in skip_words) and not any(word in line_clean.lower() for word in ['item', 'quantity', 'price', 'sku', 'description']):
                    print(f"Skipping line (only contains skip words): '{line_clean}'")
                    continue
                
                # Look for any line with currency symbols and numbers
                if '$' in line_clean and any(char.isdigit() for char in line_clean):
                    try:
                        # Extract ALL numbers from the line
                        all_numbers = re.findall(r'[\d,]+\.?\d*', line_clean)
                        if not all_numbers:
                            continue
                            
                        # Extract ALL currency amounts
                        currency_amounts = re.findall(r'\$?([\d,]+\.?\d*)', line_clean)
                        if not currency_amounts:
                            continue
                        
                        # Intelligent parsing based on number of values found
                        if len(currency_amounts) >= 2:
                            # Look for specific price patterns
                            unit_price_match = re.search(r'(?:unit\s+price|price|cost)\s*:?\s*\$?([\d,]+\.?\d*)', line_clean, re.IGNORECASE)
                            total_price_match = re.search(r'(?:total|amount|sum)\s*:?\s*\$?([\d,]+\.?\d*)', line_clean, re.IGNORECASE)
                            
                            # Look for the "x" format: $price x quantity = $total
                            x_format_match = re.search(r'\$?([\d,]+\.?\d*)\s*x\s*(\d+)\s*=\s*\$?([\d,]+\.?\d*)', line_clean)
                            if x_format_match:
                                unit_price = float(x_format_match.group(1).replace(',', ''))
                                quantity = int(x_format_match.group(2))
                                total_price = float(x_format_match.group(3).replace(',', ''))
                            elif unit_price_match and total_price_match:
                                unit_price = float(unit_price_match.group(1).replace(',', ''))
                                total_price = float(total_price_match.group(1).replace(',', ''))
                            else:
                                # Fallback: assume first and last currency amounts
                                unit_price = float(currency_amounts[0].replace(',', ''))
                                total_price = float(currency_amounts[-1].replace(',', ''))
                            
                            # Only calculate quantity if not already set by "x" format
                            if quantity == 1:
                                # Try to find quantity pattern like "Quantity: 10" or "Qty: 10"
                                qty_match = re.search(r'(?:quantity|qty|qty\.?)\s*:?\s*(\d+)', line_clean, re.IGNORECASE)
                                if qty_match:
                                    quantity = int(qty_match.group(1))
                                else:
                                    # Calculate quantity if reasonable
                                    if unit_price > 0:
                                        calculated_qty = total_price / unit_price
                                        if 0.1 <= calculated_qty <= 10000:  # Reasonable range
                                            quantity = calculated_qty
                            
                            # Extract description (everything before first $)
                            first_dollar = line_clean.find('$')
                            if first_dollar > 0:
                                description = line_clean[:first_dollar].strip()
                                
                                # Clean up description - remove common prefixes
                                description = re.sub(r'^[A-Za-z]+:\s*', '', description)  # Remove "Item:" prefix
                                description = re.sub(r'^[A-Za-z]+\s+[A-Za-z]+:\s*', '', description)  # Remove "Unit Price:" prefix
                                description = description.strip()
                                
                                # If description is too long, try to extract just the item name
                                if len(description) > 50:
                                    # Look for "Item:" in the description
                                    item_match = re.search(r'Item:\s*([^:]+)', description)
                                    if item_match:
                                        description = item_match.group(1).strip()
                                
                                # Clean up common suffixes that shouldn't be in item names
                                description = re.sub(r'\s+(?:quantity|qty|qty\.?|unit\s+price|price|cost|total|amount|sum)\s*$', '', description, flags=re.IGNORECASE)
                                
                                if len(description) >= 3:
                                    # Validate and correct the data before adding
                                    validated_item = self._validate_and_correct_item(
                                        description, quantity, unit_price, total_price
                                    )
                                    
                                    if validated_item:
                                        items.append(validated_item)
                                        print(f"Intelligent extraction: {validated_item['quantity']}x {validated_item['description']} @ ${validated_item['unitPrice']} = ${validated_item['total']}")
                                    else:
                                        print(f"Skipping invalid item: {description}")
                        
                        elif len(currency_amounts) == 1:
                            # Single price: assume it's unit price, quantity = 1
                            unit_price = float(currency_amounts[0].replace(',', ''))
                            total_price = unit_price
                            
                            # Extract description
                            first_dollar = line_clean.find('$')
                            if first_dollar > 0:
                                description = line_clean[:first_dollar].strip()
                                description = re.sub(r'^[A-Za-z]+:\s*', '', description)  # Remove "Item:" prefix
                                description = re.sub(r'^[A-Za-z]+\s+[A-Za-z]+:\s*', '', description)  # Remove "Unit Price:" prefix
                                description = description.strip()
                                
                                # If description is too long, try to extract just the item name
                                if len(description) > 50:
                                    # Look for "Item:" in the description
                                    item_match = re.search(r'Item:\s*([^:]+)', description)
                                    if item_match:
                                        description = item_match.group(1).strip()
                                
                                # Clean up common suffixes that shouldn't be in item names
                                description = re.sub(r'\s+(?:quantity|qty|qty\.?|unit\s+price|price|cost|total|amount|sum)\s*$', '', description, flags=re.IGNORECASE)
                                
                                if len(description) >= 3:
                                    # Validate and correct the data before adding
                                    validated_item = self._validate_and_correct_item(
                                        description, 1, unit_price, total_price
                                    )
                                    
                                    if validated_item:
                                        items.append(validated_item)
                                        print(f"Intelligent extraction: 1x {validated_item['description']} @ ${validated_item['unitPrice']}")
                                    else:
                                        print(f"Skipping invalid item: {description}")
                                    
                    except Exception as e:
                        print(f"Intelligent extraction error: {e}")
                        continue
        
        return items
    
    def _detect_currency(self, text: str) -> str:
        """Detect currency from text"""
        currency_patterns = {
            'USD': [r'\$', r'USD', r'US\$', r'dollars?', r'bucks?'],
            'EUR': [r'€', r'EUR', r'euros?'],
            'GBP': [r'£', r'GBP', r'pounds?'],
            'CAD': [r'CAD', r'C\$', r'Canadian dollars?'],
            'AUD': [r'AUD', r'A\$', r'Australian dollars?'],
            'JPY': [r'¥', r'JPY', r'yen'],
            'INR': [r'₹', r'INR', r'rupees?'],
            'CNY': [r'¥', r'CNY', r'RMB', r'yuan']
        }
        
        text_upper = text.upper()
        for currency, patterns in currency_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text_upper, re.IGNORECASE):
                    return currency
        
        # Default to USD if no currency detected
        return 'USD'
    
    def _convert_currency(self, items: list, from_currency: str) -> list:
        """Convert items to base currency"""
        if from_currency == self.base_currency:
            return items
        
        # Get exchange rate (in real implementation, this would be real-time)
        rate = self.exchange_rates.get(from_currency, 1.0)
        
        converted_items = []
        for item in items:
            converted_item = item.copy()
            converted_item['unitPrice'] = round(item['unitPrice'] * rate, 2)
            converted_item['total'] = round(item['total'] * rate, 2)
            converted_items.append(converted_item)
        
        return converted_items
    
    def _extract_terms(self, text: str) -> dict:
        """Extract payment and warranty terms"""
        terms = {"payment": "Net 30", "warranty": "Standard warranty"}
        
        # Extract payment terms
        payment_patterns = [
            r'payment[:\-]\s*([A-Za-z0-9\s]+)',
            r'net\s+(\d+)',
            r'(\d+)\s+days',
        ]
        
        for pattern in payment_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                terms["payment"] = match.group(1).strip()
                break
        
        # Extract warranty terms
        warranty_patterns = [
            r'warranty[:\-]\s*([A-Za-z0-9\s]+)',
            r'(\d+)\s+year[s]?\s+warranty',
        ]
        
        for pattern in warranty_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                terms["warranty"] = match.group(1).strip()
                break
        
        return terms
    
    def _deduplicate_items(self, items: list) -> list:
        """Deduplicate items by description and unit price"""
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
    
    def _validate_and_correct_item(self, description: str, quantity: float, unit_price: float, total_price: float) -> dict:
        """Validate and correct item data, returning None if invalid"""
        try:
            # Convert quantity to integer if it's a float
            if isinstance(quantity, float):
                if quantity < 0.1:  # Too small, likely an error
                    return None
                quantity = int(round(quantity))
            
            # Basic validation
            if quantity <= 0 or quantity > 100000:
                return None
            
            # Allow negative unit prices for discounts, but cap at reasonable range
            if unit_price < -100000 or unit_price > 100000:
                return None
            
            if len(description) < 2:
                return None
            
            # Check for mathematical consistency
            expected_total = quantity * unit_price
            discrepancy = abs(total_price - expected_total)
            # Handle negative values for percentage calculation
            percentage_error = (discrepancy / abs(expected_total)) * 100 if expected_total != 0 else 0
            
            # Track major corrections (>20% error) for reporting
            correction_info = None
            if percentage_error > 20:
                correction_info = {
                    "item": description,
                    "original_total": total_price,
                    "corrected_total": expected_total,
                    "error_percentage": percentage_error
                }
                print(f"MAJOR CORRECTION: {description}: ${total_price} → ${expected_total} ({percentage_error:.1f}% error)")
                total_price = expected_total
            elif percentage_error > 5:
                print(f"Minor correction: {description}: ${total_price} → ${expected_total} ({percentage_error:.1f}% error)")
                total_price = expected_total
            
            # Final validation
            if not self._validate_item_values(quantity, unit_price, description):
                return None
            
            result = {
                "sku": f"ITEM-{hash(description) % 1000:03d}",
                "description": description,
                "quantity": quantity,
                "unitPrice": unit_price,
                "deliveryTime": "7-10 days",
                "total": total_price
            }
            
            # Include correction info if there was a major correction
            if correction_info:
                result["correction_info"] = correction_info
            
            return result
            
        except Exception as e:
            print(f"Error validating item {description}: {e}")
            return None

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
            
            # Convert major corrections if any
            major_corrections = None
            if "major_corrections" in quote_data:
                from .models import MathCorrection
                major_corrections = [
                    MathCorrection(
                        item=correction["item"],
                        original_total=correction["original_total"],
                        corrected_total=correction["corrected_total"],
                        error_percentage=correction["error_percentage"]
                    )
                    for correction in quote_data["major_corrections"]
                ]
            
            return VendorQuote(
                vendorName=vendor_name,
                items=items,
                terms=terms,
                major_corrections=major_corrections
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