import re
from typing import Dict, Any, Optional, Tuple, List
from decimal import Decimal

class CurrencyHandler:
    """Handle different currencies and currency conversion in vendor quotes"""
    
    def __init__(self):
        # Currency symbols and codes
        self.currency_patterns = {
            "USD": {
                "symbols": ["$", "USD", "US$", "dollars"],
                "regex": r"[\$]?\s*([\d,]+\.?\d*)\s*(?:USD|US\$|dollars?)?",
                "exchange_rate": 1.0
            },
            "EUR": {
                "symbols": ["€", "EUR", "euros"],
                "regex": r"[€]?\s*([\d,]+\.?\d*)\s*(?:EUR|euros?)",
                "exchange_rate": 1.08  # Approximate USD rate
            },
            "GBP": {
                "symbols": ["£", "GBP", "pounds"],
                "regex": r"[£]?\s*([\d,]+\.?\d*)\s*(?:GBP|pounds?)",
                "exchange_rate": 1.26  # Approximate USD rate
            },
            "CAD": {
                "symbols": ["C$", "CAD", "Canadian dollars"],
                "regex": r"(?:C\$|CAD)?\s*([\d,]+\.?\d*)\s*(?:CAD|Canadian\s+dollars?)",
                "exchange_rate": 0.74  # Approximate USD rate
            },
            "AUD": {
                "symbols": ["A$", "AUD", "Australian dollars"],
                "regex": r"(?:A\$|AUD)?\s*([\d,]+\.?\d*)\s*(?:AUD|Australian\s+dollars?)",
                "exchange_rate": 0.66  # Approximate USD rate
            },
            "JPY": {
                "symbols": ["¥", "JPY", "yen"],
                "regex": r"[¥]?\s*([\d,]+\.?\d*)\s*(?:JPY|yen)",
                "exchange_rate": 0.0067  # Approximate USD rate
            }
        }
        
        # Common currency indicators in text
        self.currency_indicators = [
            "currency", "exchange rate", "conversion", "USD", "EUR", "GBP", "CAD", "AUD", "JPY"
        ]
    
    def detect_currency(self, text: str) -> Dict[str, Any]:
        """Detect currency used in the quote"""
        text_lower = text.lower()
        detected_currencies = []
        
        # Check for currency symbols and codes
        for currency_code, currency_info in self.currency_patterns.items():
            for symbol in currency_info["symbols"]:
                if symbol.lower() in text_lower:
                    detected_currencies.append({
                        "currency": currency_code,
                        "symbol": symbol,
                        "confidence": "high"
                    })
        
        # Check for currency indicators in text
        for indicator in self.currency_indicators:
            if indicator.lower() in text_lower:
                # Look for currency code near the indicator
                for currency_code in self.currency_patterns.keys():
                    if currency_code.lower() in text_lower:
                        detected_currencies.append({
                            "currency": currency_code,
                            "indicator": indicator,
                            "confidence": "medium"
                        })
        
        # If no currency detected, assume USD
        if not detected_currencies:
            return {
                "primary_currency": "USD",
                "confidence": "assumed",
                "detected_currencies": [],
                "conversion_needed": False
            }
        
        # Return the most frequently detected currency
        currency_counts = {}
        for detection in detected_currencies:
            currency = detection["currency"]
            currency_counts[currency] = currency_counts.get(currency, 0) + 1
        
        primary_currency = max(currency_counts, key=currency_counts.get)
        
        return {
            "primary_currency": primary_currency,
            "confidence": "detected",
            "detected_currencies": detected_currencies,
            "conversion_needed": primary_currency != "USD"
        }
    
    def extract_and_normalize_prices(self, text: str, target_currency: str = "USD") -> List[Dict[str, Any]]:
        """Extect prices from text and normalize to target currency"""
        prices = []
        text_lines = text.split('\n')
        
        for line_num, line in enumerate(text_lines):
            line_clean = line.strip()
            
            # Try each currency pattern
            for currency_code, currency_info in self.currency_patterns.items():
                matches = re.finditer(currency_info["regex"], line_clean, re.IGNORECASE)
                
                for match in matches:
                    try:
                        # Extract the price value
                        price_str = match.group(1).replace(',', '')
                        original_price = Decimal(price_str)
                        
                        # Convert to target currency
                        if currency_code == target_currency:
                            normalized_price = original_price
                        else:
                            # Convert using exchange rate
                            normalized_price = original_price * currency_info["exchange_rate"]
                        
                        prices.append({
                            "line_number": line_num + 1,
                            "line_text": line_clean,
                            "original_currency": currency_code,
                            "original_price": float(original_price),
                            "normalized_price": float(normalized_price),
                            "target_currency": target_currency,
                            "exchange_rate": currency_info["exchange_rate"]
                        })
                        
                    except (ValueError, TypeError) as e:
                        # Skip invalid price formats
                        continue
        
        return prices
    
    def normalize_quote_items(self, items: List[Dict[str, Any]], target_currency: str = "USD") -> List[Dict[str, Any]]:
        """Normalize quote items to target currency"""
        normalized_items = []
        
        for item in items:
            normalized_item = item.copy()
            
            # Normalize unit price
            if "unitPrice" in item and item["unitPrice"]:
                original_price = item["unitPrice"]
                original_currency = item.get("currency", "USD")
                
                if original_currency != target_currency:
                    exchange_rate = self.currency_patterns.get(original_currency, {}).get("exchange_rate", 1.0)
                    normalized_item["unitPrice"] = original_price * exchange_rate
                    normalized_item["original_unit_price"] = original_price
                    normalized_item["original_currency"] = original_currency
                    normalized_item["exchange_rate"] = exchange_rate
                
                normalized_item["currency"] = target_currency
            
            # Normalize total price
            if "total" in item and item["total"]:
                original_total = item["total"]
                original_currency = item.get("currency", "USD")
                
                if original_currency != target_currency:
                    exchange_rate = self.currency_patterns.get(original_currency, {}).get("exchange_rate", 1.0)
                    normalized_item["total"] = original_total * exchange_rate
                    normalized_item["original_total"] = original_total
                
                normalized_item["currency"] = target_currency
            
            normalized_items.append(normalized_item)
        
        return normalized_items
    
    def generate_currency_report(self, text: str) -> Dict[str, Any]:
        """Generate a report about currencies found in the quote"""
        currency_detection = self.detect_currency(text)
        prices = self.extract_and_normalize_prices(text)
        
        # Group prices by currency
        prices_by_currency = {}
        for price in prices:
            currency = price["original_currency"]
            if currency not in prices_by_currency:
                prices_by_currency[currency] = []
            prices_by_currency[currency].append(price)
        
        # Calculate totals by currency
        totals_by_currency = {}
        for currency, currency_prices in prices_by_currency.items():
            total = sum(price["original_price"] for price in currency_prices)
            normalized_total = sum(price["normalized_price"] for price in currency_prices)
            totals_by_currency[currency] = {
                "total": total,
                "normalized_total": normalized_total,
                "count": len(currency_prices)
            }
        
        return {
            "currency_detection": currency_detection,
            "prices_found": len(prices),
            "prices_by_currency": prices_by_currency,
            "totals_by_currency": totals_by_currency,
            "conversion_summary": self._generate_conversion_summary(totals_by_currency)
        }
    
    def _generate_conversion_summary(self, totals_by_currency: Dict[str, Any]) -> str:
        """Generate a summary of currency conversions"""
        if len(totals_by_currency) == 1:
            currency = list(totals_by_currency.keys())[0]
            if currency == "USD":
                return "All prices are in USD. No conversion needed."
            else:
                total = totals_by_currency[currency]["total"]
                normalized = totals_by_currency[currency]["normalized_total"]
                return f"All prices converted from {currency} to USD. Total: {currency} {total:,.2f} → USD {normalized:,.2f}"
        
        summary_parts = []
        for currency, data in totals_by_currency.items():
            if currency != "USD":
                summary_parts.append(f"{currency} {data['total']:,.2f} → USD {data['normalized_total']:,.2f}")
        
        return f"Multiple currencies detected. Conversions: {', '.join(summary_parts)}"
    
    def validate_currency_consistency(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validate that all items use consistent currency"""
        currencies_found = set()
        
        for item in items:
            if "currency" in item:
                currencies_found.add(item["currency"])
        
        if len(currencies_found) == 0:
            return {
                "consistent": True,
                "issue": "No currency information found",
                "recommendation": "Assume USD for all items"
            }
        elif len(currencies_found) == 1:
            return {
                "consistent": True,
                "currency": list(currencies_found)[0],
                "issue": None
            }
        else:
            return {
                "consistent": False,
                "currencies_found": list(currencies_found),
                "issue": f"Mixed currencies detected: {', '.join(currencies_found)}",
                "recommendation": "Normalize all prices to USD for comparison"
            }

# Global instance
currency_handler = CurrencyHandler()
