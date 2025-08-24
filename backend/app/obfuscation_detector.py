import re
from typing import List, Dict, Any, Optional
from difflib import SequenceMatcher
import json
import os
from datetime import datetime
from .models import VendorQuote, QuoteItem

class ObfuscationDetector:
    """Detect vendor pricing obfuscation and hidden cost structures with adaptive learning"""
    
    def __init__(self):
        # Core patterns that indicate potential obfuscation
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
                r"cancellation\s+fee",
                r"management\s+fee",
                r"maintenance\s+fee",
                r"support\s+fee",
                r"licensing\s+fee",
                r"subscription\s+fee"
            ],
            "bundled_pricing": [
                r"package\s+deal",
                r"bundle\s+price",
                r"all\s+inclusive",
                r"comprehensive\s+pricing",
                r"total\s+solution",
                r"complete\s+package",
                r"suite\s+pricing",
                r"enterprise\s+package"
            ],
            "volume_discounts": [
                r"tier\s+pricing",
                r"volume\s+discount",
                r"quantity\s+break",
                r"bulk\s+pricing",
                r"scale\s+pricing",
                r"threshold\s+pricing"
            ],
            "conditional_pricing": [
                r"subject\s+to",
                r"depending\s+on",
                r"may\s+vary",
                r"estimated\s+price",
                r"approximate\s+cost",
                r"plus\s+applicable",
                r"additional\s+charges\s+may\s+apply",
                r"prices\s+subject\s+to\s+change",
                r"market\s+conditions",
                r"availability\s+may\s+affect\s+pricing"
            ],
            "complex_structures": [
                r"base\s+price\s+plus",
                r"core\s+pricing\s+plus",
                r"minimum\s+order\s+value",
                r"subscription\s+model",
                r"recurring\s+charges",
                r"monthly\s+fee",
                r"annual\s+maintenance",
                r"per\s+user\s+pricing",
                r"usage\s+based\s+pricing"
            ]
        }
        
        # Suspicious pricing indicators
        self.suspicious_indicators = [
            "TBD", "TBA", "To be determined", "To be advised",
            "Call for pricing", "Contact sales", "Quote required",
            "Market rate", "Current market", "Prevailing rate",
            "Negotiable", "Flexible pricing", "Custom quote"
        ]
        
        # Adaptive learning storage
        self.learned_patterns_file = "learned_obfuscation_patterns.json"
        self.learned_patterns = self._load_learned_patterns()
        
        # Confidence thresholds
        self.confidence_thresholds = {
            "exact_match": 1.0,
            "high_confidence": 0.85,
            "medium_confidence": 0.70,
            "low_confidence": 0.50
        }
    
    def _load_learned_patterns(self) -> Dict[str, List[str]]:
        """Load previously learned patterns from file"""
        try:
            if os.path.exists(self.learned_patterns_file):
                with open(self.learned_patterns_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading learned patterns: {e}")
        return {"hidden_fees": [], "bundled_pricing": [], "conditional_pricing": [], "complex_structures": []}
    
    def _save_learned_patterns(self):
        """Save learned patterns to file"""
        try:
            with open(self.learned_patterns_file, 'w') as f:
                json.dump(self.learned_patterns, f, indent=2)
        except Exception as e:
            print(f"Error saving learned patterns: {e}")
    
    def learn_new_pattern(self, category: str, pattern: str, confidence: float = 0.8):
        """Learn a new obfuscation pattern from user feedback"""
        if category in self.learned_patterns and confidence >= self.confidence_thresholds["medium_confidence"]:
            if pattern not in self.learned_patterns[category]:
                self.learned_patterns[category].append(pattern)
                self._save_learned_patterns()
                print(f"Learned new {category} pattern: {pattern}")
    
    def _fuzzy_match_patterns(self, text: str, patterns: List[str], threshold: float = 0.8) -> List[str]:
        """Use fuzzy matching to find similar patterns"""
        matches = []
        text_lower = text.lower()
        
        for pattern in patterns:
            # Exact match first
            if re.search(pattern, text_lower):
                matches.append(pattern)
                continue
            
            # Fuzzy match for similar terms
            pattern_words = pattern.replace(r'\s+', ' ').split()
            text_words = text_lower.split()
            
            for i in range(len(text_words) - len(pattern_words) + 1):
                text_segment = ' '.join(text_words[i:i + len(pattern_words)])
                similarity = SequenceMatcher(None, pattern, text_segment).ratio()
                
                if similarity >= threshold:
                    matches.append(f"fuzzy_match:{pattern} (similarity: {similarity:.2f})")
        
        return matches
    
    def _detect_adaptive_patterns(self, text: str) -> Dict[str, List[str]]:
        """Detect patterns using both core and learned patterns"""
        results = {}
        text_lower = text.lower()
        
        # Check core patterns
        for category, patterns in self.obfuscation_patterns.items():
            matches = []
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    matches.append(pattern)
            results[category] = matches
        
        # Check learned patterns with fuzzy matching
        for category, learned_patterns in self.learned_patterns.items():
            if category not in results:
                results[category] = []
            
            fuzzy_matches = self._fuzzy_match_patterns(text, learned_patterns)
            results[category].extend(fuzzy_matches)
        
        return results
    
    def _detect_contextual_obfuscation(self, text: str) -> List[Dict[str, Any]]:
        """Detect obfuscation based on context and patterns"""
        contextual_issues = []
        
        # Look for price-related terms with uncertainty indicators
        uncertainty_patterns = [
            r"(\d+\.?\d*)\s*(?:USD|dollars?|€|euros?)\s*(?:approximately|about|around|roughly|estimated)",
            r"(?:approximately|about|around|roughly|estimated)\s*(\d+\.?\d*)\s*(?:USD|dollars?|€|euros?)",
            r"(?:price|cost|fee)\s+(?:may|might|could)\s+(?:vary|change|differ)",
            r"(?:final|total)\s+(?:price|cost)\s+(?:to\s+be|will\s+be)\s+(?:determined|calculated)"
        ]
        
        for pattern in uncertainty_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                contextual_issues.append({
                    "type": "contextual_uncertainty",
                    "pattern": pattern,
                    "matches": matches,
                    "description": "Pricing uncertainty detected in context"
                })
        
        # Look for hidden terms in fine print
        fine_print_indicators = [
            r"(?:terms|conditions|details|fine\s+print)\s+(?:apply|may\s+apply|subject\s+to)",
            r"(?:see|refer\s+to)\s+(?:terms|conditions|schedule|appendix)",
            r"(?:additional|extra|other)\s+(?:charges|fees|costs)\s+(?:may|will)\s+(?:apply|incur)"
        ]
        
        for pattern in fine_print_indicators:
            if re.search(pattern, text, re.IGNORECASE):
                contextual_issues.append({
                    "type": "fine_print_obfuscation",
                    "pattern": pattern,
                    "description": "Potential hidden terms in fine print"
                })
        
        return contextual_issues
    
    def analyze_quote(self, quote: VendorQuote, raw_text: str = "") -> Dict[str, Any]:
        """Analyze a quote for pricing obfuscation with adaptive learning"""
        issues = []
        risk_score = 0
        total_risk_factors = 0
        
        # Use adaptive pattern detection
        adaptive_results = self._detect_adaptive_patterns(raw_text)
        
        # Check for hidden fees
        if adaptive_results.get("hidden_fees"):
            issues.append({
                "type": "hidden_fees",
                "severity": "high",
                "description": f"Found {len(adaptive_results['hidden_fees'])} potential hidden fees",
                "details": adaptive_results["hidden_fees"],
                "confidence": "high" if len(adaptive_results["hidden_fees"]) > 0 else "medium"
            })
            risk_score += 30
            total_risk_factors += 1
        
        # Check for bundled pricing
        if adaptive_results.get("bundled_pricing"):
            issues.append({
                "type": "bundled_pricing",
                "severity": "medium",
                "description": "Bundled pricing detected - difficult to compare individual items",
                "details": adaptive_results["bundled_pricing"],
                "confidence": "high"
            })
            risk_score += 20
            total_risk_factors += 1
        
        # Check for conditional pricing
        if adaptive_results.get("conditional_pricing"):
            issues.append({
                "type": "conditional_pricing",
                "severity": "medium",
                "description": "Conditional pricing terms found",
                "details": adaptive_results["conditional_pricing"],
                "confidence": "high"
            })
            risk_score += 25
            total_risk_factors += 1
        
        # Check for complex pricing structures
        if adaptive_results.get("complex_structures"):
            issues.append({
                "type": "complex_pricing",
                "severity": "high",
                "description": "Complex pricing structure detected",
                "details": adaptive_results["complex_structures"],
                "confidence": "high"
            })
            risk_score += 35
            total_risk_factors += 1
        
        # Check for contextual obfuscation
        contextual_issues = self._detect_contextual_obfuscation(raw_text)
        if contextual_issues:
            issues.append({
                "type": "contextual_obfuscation",
                "severity": "medium",
                "description": f"Found {len(contextual_issues)} contextual obfuscation indicators",
                "details": contextual_issues,
                "confidence": "medium"
            })
            risk_score += 20
            total_risk_factors += 1
        
        # Check for suspicious pricing in items
        suspicious_items = self._detect_suspicious_items(quote.items)
        if suspicious_items:
            issues.append({
                "type": "suspicious_pricing",
                "severity": "high",
                "description": f"Found {len(suspicious_items)} items with suspicious pricing",
                "details": suspicious_items,
                "confidence": "high"
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
                "details": inconsistency_issues,
                "confidence": "high"
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
            "recommendations": self._generate_recommendations(issues),
            "adaptability_info": {
                "patterns_checked": len(self.obfuscation_patterns) + len(self.learned_patterns),
                "learned_patterns_used": len([p for patterns in self.learned_patterns.values() for p in patterns if p]),
                "fuzzy_matching_enabled": True,
                "contextual_analysis": True
            }
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
