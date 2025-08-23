import re
from typing import List, Dict, Any, Optional
from .models import VendorQuote, QuoteItem

class ObfuscationDetector:
    """Detect vendor pricing obfuscation and hidden cost structures"""
    
    def __init__(self):
        # Patterns that indicate potential obfuscation
        self.obfuscation_patterns = {
            "hidden_fees": [
                r"handling\s+fee",
                r"processing\s+charge",
                r"administrative\s+fee",
                r"service\s+charge",
                r"convenience\s+fee",
                r"transaction\s+fee",
                r"setup\s+fee",
                r"activation\s+fee",
                r"restocking\s+fee",
                r"cancellation\s+fee"
            ],
            "bundled_pricing": [
                r"package\s+deal",
                r"bundle\s+price",
                r"all\s+inclusive",
                r"comprehensive\s+pricing",
                r"total\s+solution",
                r"complete\s+package"
            ],
            "volume_discounts": [
                r"tier\s+pricing",
                r"volume\s+discount",
                r"quantity\s+break",
                r"bulk\s+pricing",
                r"scale\s+pricing"
            ],
            "conditional_pricing": [
                r"subject\s+to",
                r"depending\s+on",
                r"may\s+vary",
                r"estimated\s+price",
                r"approximate\s+cost",
                r"plus\s+applicable",
                r"additional\s+charges\s+may\s+apply"
            ],
            "complex_structures": [
                r"base\s+price\s+plus",
                r"core\s+pricing\s+plus",
                r"minimum\s+order\s+value",
                r"subscription\s+model",
                r"recurring\s+charges",
                r"monthly\s+fee"
            ]
        }
        
        # Suspicious pricing indicators
        self.suspicious_indicators = [
            "TBD", "TBA", "To be determined", "To be advised",
            "Call for pricing", "Contact sales", "Quote required",
            "Market rate", "Current market", "Prevailing rate"
        ]
    
    def analyze_quote(self, quote: VendorQuote, raw_text: str = "") -> Dict[str, Any]:
        """Analyze a quote for pricing obfuscation"""
        issues = []
        risk_score = 0
        total_risk_factors = 0
        
        # Check for hidden fees in text
        hidden_fees = self._detect_hidden_fees(raw_text)
        if hidden_fees:
            issues.append({
                "type": "hidden_fees",
                "severity": "high",
                "description": f"Found {len(hidden_fees)} potential hidden fees",
                "details": hidden_fees
            })
            risk_score += 30
            total_risk_factors += 1
        
        # Check for bundled pricing
        bundled_issues = self._detect_bundled_pricing(raw_text)
        if bundled_issues:
            issues.append({
                "type": "bundled_pricing",
                "severity": "medium",
                "description": "Bundled pricing detected - difficult to compare individual items",
                "details": bundled_issues
            })
            risk_score += 20
            total_risk_factors += 1
        
        # Check for conditional pricing
        conditional_issues = self._detect_conditional_pricing(raw_text)
        if conditional_issues:
            issues.append({
                "type": "conditional_pricing",
                "severity": "medium",
                "description": "Conditional pricing terms found",
                "details": conditional_issues
            })
            risk_score += 25
            total_risk_factors += 1
        
        # Check for complex pricing structures
        complex_issues = self._detect_complex_structures(raw_text)
        if complex_issues:
            issues.append({
                "type": "complex_pricing",
                "severity": "high",
                "description": "Complex pricing structure detected",
                "details": complex_issues
            })
            risk_score += 35
            total_risk_factors += 1
        
        # Check for suspicious pricing in items
        suspicious_items = self._detect_suspicious_items(quote.items)
        if suspicious_items:
            issues.append({
                "type": "suspicious_pricing",
                "severity": "high",
                "description": f"Found {len(suspicious_items)} items with suspicious pricing",
                "details": suspicious_items
            })
            risk_score += 40
            total_risk_factors += 1
        
        # Check for pricing inconsistencies
        inconsistency_issues = self._detect_pricing_inconsistencies(quote.items)
        if inconsistency_issues:
            issues.append({
                "type": "pricing_inconsistencies",
                "severity": "medium",
                "description": "Pricing inconsistencies detected",
                "details": inconsistency_issues
            })
            risk_score += 15
            total_risk_factors += 1
        
        # Calculate final risk score (0-100)
        final_risk_score = min(100, risk_score)
        
        # Determine risk level
        if final_risk_score >= 70:
            risk_level = "high"
        elif final_risk_score >= 40:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        return {
            "risk_level": risk_level,
            "risk_score": final_risk_score,
            "total_risk_factors": total_risk_factors,
            "issues": issues,
            "summary": self._generate_summary(issues, final_risk_score),
            "recommendations": self._generate_recommendations(issues)
        }
    
    def _detect_hidden_fees(self, text: str) -> List[str]:
        """Detect hidden fees in quote text"""
        found_fees = []
        text_lower = text.lower()
        
        for fee_type, patterns in self.obfuscation_patterns.items():
            if fee_type == "hidden_fees":
                for pattern in patterns:
                    matches = re.findall(pattern, text_lower)
                    if matches:
                        found_fees.extend(matches)
        
        return list(set(found_fees))  # Remove duplicates
    
    def _detect_bundled_pricing(self, text: str) -> List[str]:
        """Detect bundled pricing structures"""
        found_bundles = []
        text_lower = text.lower()
        
        for pattern in self.obfuscation_patterns["bundled_pricing"]:
            matches = re.findall(pattern, text_lower)
            if matches:
                found_bundles.extend(matches)
        
        return list(set(found_bundles))
    
    def _detect_conditional_pricing(self, text: str) -> List[str]:
        """Detect conditional pricing terms"""
        found_conditions = []
        text_lower = text.lower()
        
        for pattern in self.obfuscation_patterns["conditional_pricing"]:
            matches = re.findall(pattern, text_lower)
            if matches:
                found_conditions.extend(matches)
        
        return list(set(found_conditions))
    
    def _detect_complex_structures(self, text: str) -> List[str]:
        """Detect complex pricing structures"""
        found_structures = []
        text_lower = text.lower()
        
        for pattern in self.obfuscation_patterns["complex_structures"]:
            matches = re.findall(pattern, text_lower)
            if matches:
                found_structures.extend(matches)
        
        return list(set(found_structures))
    
    def _detect_suspicious_items(self, items: List[QuoteItem]) -> List[Dict[str, Any]]:
        """Detect items with suspicious pricing"""
        suspicious = []
        
        for item in items:
            # Check for zero or negative prices
            if item.unitPrice <= 0:
                suspicious.append({
                    "item": item.description,
                    "issue": "Zero or negative unit price",
                    "value": item.unitPrice
                })
            
            # Check for extremely high prices (potential placeholder)
            if item.unitPrice > 10000:
                suspicious.append({
                    "item": item.description,
                    "issue": "Extremely high unit price (possible placeholder)",
                    "value": item.unitPrice
                })
            
            # Check for suspicious delivery times
            if item.deliveryTime and any(indicator.lower() in item.deliveryTime.lower() for indicator in self.suspicious_indicators):
                suspicious.append({
                    "item": item.description,
                    "issue": "Suspicious delivery time",
                    "value": item.deliveryTime
                })
        
        return suspicious
    
    def _detect_pricing_inconsistencies(self, items: List[QuoteItem]) -> List[Dict[str, Any]]:
        """Detect pricing inconsistencies within the quote"""
        inconsistencies = []
        
        if len(items) < 2:
            return inconsistencies
        
        # Check for unusual price variations
        prices = [item.unitPrice for item in items if item.unitPrice > 0]
        if len(prices) >= 2:
            min_price = min(prices)
            max_price = max(prices)
            price_ratio = max_price / min_price if min_price > 0 else 0
            
            if price_ratio > 100:  # More than 100x difference
                inconsistencies.append({
                    "type": "extreme_price_variation",
                    "description": f"Extreme price variation: {min_price} to {max_price} ({price_ratio:.1f}x difference)",
                    "items_affected": len(items)
                })
        
        # Check for quantity vs price anomalies
        for item in items:
            if item.quantity > 1 and item.unitPrice > 0:
                # Check if bulk pricing makes sense
                expected_total = item.quantity * item.unitPrice
                actual_total = item.total
                
                if abs(expected_total - actual_total) > 0.01:  # Allow for rounding
                    discount_percentage = ((expected_total - actual_total) / expected_total) * 100
                    if discount_percentage > 50:  # More than 50% discount
                        inconsistencies.append({
                            "type": "unusual_bulk_discount",
                            "description": f"Unusual bulk discount: {discount_percentage:.1f}% off for {item.quantity} units",
                            "item": item.description
                        })
        
        return inconsistencies
    
    def _generate_summary(self, issues: List[Dict], risk_score: int) -> str:
        """Generate a summary of obfuscation issues"""
        if not issues:
            return "✅ No pricing obfuscation detected. Quote appears transparent and comparable."
        
        high_issues = [i for i in issues if i["severity"] == "high"]
        medium_issues = [i for i in issues if i["severity"] == "medium"]
        
        summary_parts = []
        
        if high_issues:
            summary_parts.append(f"🚨 {len(high_issues)} high-risk obfuscation issues detected")
        
        if medium_issues:
            summary_parts.append(f"⚠️ {len(medium_issues)} medium-risk issues found")
        
        summary_parts.append(f"Risk Score: {risk_score}/100")
        
        if risk_score >= 70:
            summary_parts.append("This quote requires careful review before comparison.")
        elif risk_score >= 40:
            summary_parts.append("Exercise caution when comparing with other vendors.")
        else:
            summary_parts.append("Minor issues detected - proceed with standard comparison.")
        
        return " | ".join(summary_parts)
    
    def _generate_recommendations(self, issues: List[Dict]) -> List[str]:
        """Generate recommendations based on detected issues"""
        recommendations = []
        
        for issue in issues:
            if issue["type"] == "hidden_fees":
                recommendations.append("🔍 Request detailed breakdown of all fees and charges")
                recommendations.append("📋 Ask for written confirmation of total cost")
            
            elif issue["type"] == "bundled_pricing":
                recommendations.append("📦 Request itemized pricing for each component")
                recommendations.append("💡 Ask if items can be purchased separately")
            
            elif issue["type"] == "conditional_pricing":
                recommendations.append("📝 Get written confirmation of all pricing conditions")
                recommendations.append("⏰ Clarify timeline for price validity")
            
            elif issue["type"] == "complex_pricing":
                recommendations.append("🧮 Request simplified pricing structure")
                recommendations.append("📊 Ask for cost breakdown by component")
            
            elif issue["type"] == "suspicious_pricing":
                recommendations.append("❓ Clarify any unclear pricing terms")
                recommendations.append("✅ Get firm pricing commitments in writing")
        
        # Add general recommendations
        if issues:
            recommendations.append("📞 Contact vendor for clarification on all unclear terms")
            recommendations.append("📄 Request formal quote with all terms clearly stated")
        
        return list(set(recommendations))  # Remove duplicates

# Global instance
obfuscation_detector = ObfuscationDetector()
