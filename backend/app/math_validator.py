from typing import List, Dict, Any, Optional
from .models import VendorQuote, QuoteItem
import math

class MathValidator:
    """Enhanced math validation for vendor quotes"""
    
    def __init__(self):
        # Tolerance for rounding differences
        self.rounding_tolerance = 0.01
        
        # Thresholds for flagging issues
        self.thresholds = {
            "large_discount": 0.50,  # 50% discount
            "extreme_price_variation": 100,  # 100x price difference
            "unusual_quantity": 10000,  # Very large quantities
            "suspicious_unit_price": 10000,  # Very high unit prices
            "zero_price": 0,
            "negative_price": -0.01
        }
    
    def validate_quote(self, quote: VendorQuote) -> Dict[str, Any]:
        """Comprehensive validation of quote mathematics"""
        issues = []
        warnings = []
        total_issues = 0
        
        # Validate each item
        for i, item in enumerate(quote.items):
            item_issues = self._validate_item(item, i)
            issues.extend(item_issues)
            total_issues += len(item_issues)
        
        # Validate quote-level calculations
        quote_issues = self._validate_quote_totals(quote)
        issues.extend(quote_issues)
        total_issues += len(quote_issues)
        
        # Generate warnings for suspicious patterns
        warnings = self._generate_warnings(quote)
        
        # Calculate validation score (0-100)
        validation_score = self._calculate_validation_score(quote, total_issues)
        
        # Determine overall status
        if total_issues == 0:
            status = "valid"
        elif total_issues <= 2:
            status = "minor_issues"
        elif total_issues <= 5:
            status = "moderate_issues"
        else:
            status = "major_issues"
        
        return {
            "status": status,
            "validation_score": validation_score,
            "total_issues": total_issues,
            "total_warnings": len(warnings),
            "issues": issues,
            "warnings": warnings,
            "summary": self._generate_summary(issues, warnings, validation_score),
            "recommendations": self._generate_recommendations(issues, warnings)
        }
    
    def _validate_item(self, item: QuoteItem, item_index: int) -> List[Dict[str, Any]]:
        """Validate individual item calculations"""
        issues = []
        
        # Check for basic mathematical errors
        expected_total = item.quantity * item.unitPrice
        actual_total = item.total
        
        # Check if calculation is correct
        if abs(expected_total - actual_total) > self.rounding_tolerance:
            discrepancy = abs(expected_total - actual_total)
            percentage_error = (discrepancy / expected_total) * 100 if expected_total > 0 else 0
            
            issues.append({
                "type": "calculation_error",
                "severity": "high",
                "item_index": item_index,
                "item_description": item.description,
                "description": f"Line item calculation error: {item.quantity} × ${item.unitPrice:.2f} = ${expected_total:.2f}, but total shows ${actual_total:.2f}",
                "details": {
                    "expected": expected_total,
                    "actual": actual_total,
                    "discrepancy": discrepancy,
                    "percentage_error": percentage_error
                }
            })
        
        # Check for zero or negative prices
        if item.unitPrice <= self.thresholds["zero_price"]:
            issues.append({
                "type": "invalid_price",
                "severity": "high",
                "item_index": item_index,
                "item_description": item.description,
                "description": f"Invalid unit price: ${item.unitPrice:.2f}",
                "details": {
                    "unit_price": item.unitPrice,
                    "issue": "Zero or negative price"
                }
            })
        
        # Check for suspiciously high prices
        if item.unitPrice > self.thresholds["suspicious_unit_price"]:
            issues.append({
                "type": "suspicious_price",
                "severity": "medium",
                "item_index": item_index,
                "item_description": item.description,
                "description": f"Suspiciously high unit price: ${item.unitPrice:.2f}",
                "details": {
                    "unit_price": item.unitPrice,
                    "threshold": self.thresholds["suspicious_unit_price"]
                }
            })
        
        # Check for unusual quantities
        if item.quantity > self.thresholds["unusual_quantity"]:
            issues.append({
                "type": "unusual_quantity",
                "severity": "medium",
                "item_index": item_index,
                "item_description": item.description,
                "description": f"Unusually large quantity: {item.quantity}",
                "details": {
                    "quantity": item.quantity,
                    "threshold": self.thresholds["unusual_quantity"]
                }
            })
        
        # Check for zero quantities
        if item.quantity <= 0:
            issues.append({
                "type": "invalid_quantity",
                "severity": "high",
                "item_index": item_index,
                "item_description": item.description,
                "description": f"Invalid quantity: {item.quantity}",
                "details": {
                    "quantity": item.quantity,
                    "issue": "Zero or negative quantity"
                }
            })
        
        return issues
    
    def _validate_quote_totals(self, quote: VendorQuote) -> List[Dict[str, Any]]:
        """Validate quote-level calculations"""
        issues = []
        
        if not quote.items:
            return issues
        
        # Calculate expected quote total
        expected_quote_total = sum(item.total for item in quote.items)
        
        # Check for individual item total consistency
        for i, item in enumerate(quote.items):
            if item.total != (item.quantity * item.unitPrice):
                issues.append({
                    "type": "item_total_mismatch",
                    "severity": "high",
                    "item_index": i,
                    "item_description": item.description,
                    "description": f"Item total mismatch: {item.quantity} × ${item.unitPrice:.2f} ≠ ${item.total:.2f}",
                    "details": {
                        "calculated": item.quantity * item.unitPrice,
                        "stated": item.total,
                        "difference": abs((item.quantity * item.unitPrice) - item.total)
                    }
                })
        
        # Check for price consistency across similar items
        price_consistency_issues = self._check_price_consistency(quote.items)
        issues.extend(price_consistency_issues)
        
        return issues
    
    def _check_price_consistency(self, items: List[QuoteItem]) -> List[Dict[str, Any]]:
        """Check for price consistency across similar items"""
        issues = []
        
        if len(items) < 2:
            return issues
        
        # Group items by similar descriptions
        item_groups = {}
        for item in items:
            # Create a simplified key for grouping
            key = self._normalize_description(item.description)
            if key not in item_groups:
                item_groups[key] = []
            item_groups[key].append(item)
        
        # Check each group for price consistency
        for group_key, group_items in item_groups.items():
            if len(group_items) < 2:
                continue
            
            prices = [item.unitPrice for item in group_items if item.unitPrice > 0]
            if len(prices) < 2:
                continue
            
            min_price = min(prices)
            max_price = max(prices)
            price_ratio = max_price / min_price if min_price > 0 else 0
            
            if price_ratio > self.thresholds["extreme_price_variation"]:
                issues.append({
                    "type": "price_inconsistency",
                    "severity": "medium",
                    "description": f"Extreme price variation for similar items: {min_price:.2f} to {max_price:.2f} ({price_ratio:.1f}x difference)",
                    "details": {
                        "item_group": group_key,
                        "min_price": min_price,
                        "max_price": max_price,
                        "price_ratio": price_ratio,
                        "items_affected": len(group_items)
                    }
                })
        
        return issues
    
    def _normalize_description(self, description: str) -> str:
        """Normalize item description for grouping"""
        # Remove common variations and normalize
        normalized = description.lower().strip()
        
        # Remove common prefixes/suffixes
        prefixes_to_remove = ["item", "product", "part", "sku", "model"]
        for prefix in prefixes_to_remove:
            if normalized.startswith(prefix + " "):
                normalized = normalized[len(prefix) + 1:]
        
        # Remove numbers and special characters for basic grouping
        normalized = ''.join(c for c in normalized if c.isalpha() or c.isspace())
        normalized = ' '.join(normalized.split())
        
        return normalized
    
    def _generate_warnings(self, quote: VendorQuote) -> List[Dict[str, Any]]:
        """Generate warnings for suspicious patterns"""
        warnings = []
        
        if not quote.items:
            return warnings
        
        # Check for bulk pricing patterns
        bulk_warnings = self._check_bulk_pricing_patterns(quote.items)
        warnings.extend(bulk_warnings)
        
        # Check for pricing trends
        trend_warnings = self._check_pricing_trends(quote.items)
        warnings.extend(trend_warnings)
        
        return warnings
    
    def _check_bulk_pricing_patterns(self, items: List[QuoteItem]) -> List[Dict[str, Any]]:
        """Check for unusual bulk pricing patterns"""
        warnings = []
        
        for item in items:
            if item.quantity > 1 and item.unitPrice > 0:
                expected_total = item.quantity * item.unitPrice
                actual_total = item.total
                
                if abs(expected_total - actual_total) > self.rounding_tolerance:
                    discount_percentage = ((expected_total - actual_total) / expected_total) * 100
                    
                    if discount_percentage > self.thresholds["large_discount"]:
                        warnings.append({
                            "type": "large_bulk_discount",
                            "description": f"Large bulk discount detected: {discount_percentage:.1f}% off for {item.quantity} units",
                            "details": {
                                "item": item.description,
                                "quantity": item.quantity,
                                "discount_percentage": discount_percentage,
                                "expected_total": expected_total,
                                "actual_total": actual_total
                            }
                        })
        
        return warnings
    
    def _check_pricing_trends(self, items: List[QuoteItem]) -> List[Dict[str, Any]]:
        """Check for unusual pricing trends"""
        warnings = []
        
        if len(items) < 3:
            return warnings
        
        # Check for price escalation patterns
        prices = [item.unitPrice for item in items if item.unitPrice > 0]
        if len(prices) >= 3:
            # Check if prices are consistently increasing
            increasing_count = sum(1 for i in range(1, len(prices)) if prices[i] > prices[i-1])
            if increasing_count == len(prices) - 1:
                warnings.append({
                    "type": "price_escalation",
                    "description": "Consistent price escalation detected across items",
                    "details": {
                        "price_range": f"${min(prices):.2f} to ${max(prices):.2f}",
                        "items_affected": len(prices)
                    }
                })
        
        return warnings
    
    def _calculate_validation_score(self, quote: VendorQuote, total_issues: int) -> int:
        """Calculate validation score (0-100)"""
        if not quote.items:
            return 0
        
        # Base score starts at 100
        base_score = 100
        
        # Deduct points for issues
        issue_penalty = min(total_issues * 10, 80)  # Max 80 point penalty
        
        # Bonus for clean quotes
        if total_issues == 0:
            base_score = 100
        else:
            base_score = max(20, base_score - issue_penalty)
        
        return base_score
    
    def _generate_summary(self, issues: List[Dict], warnings: List[Dict], validation_score: int) -> str:
        """Generate validation summary"""
        if validation_score == 100:
            return "✅ All calculations validated successfully. Quote appears mathematically sound."
        
        high_issues = [i for i in issues if i["severity"] == "high"]
        medium_issues = [i for i in issues if i["severity"] == "medium"]
        
        summary_parts = []
        
        if high_issues:
            summary_parts.append(f"🚨 {len(high_issues)} critical calculation errors")
        
        if medium_issues:
            summary_parts.append(f"⚠️ {len(medium_issues)} validation warnings")
        
        if warnings:
            summary_parts.append(f"💡 {len(warnings)} pattern warnings")
        
        summary_parts.append(f"Validation Score: {validation_score}/100")
        
        if validation_score < 50:
            summary_parts.append("Quote requires immediate review and correction.")
        elif validation_score < 80:
            summary_parts.append("Quote has issues that should be addressed.")
        else:
            summary_parts.append("Minor issues detected - proceed with caution.")
        
        return " | ".join(summary_parts)
    
    def _generate_recommendations(self, issues: List[Dict], warnings: List[Dict]) -> List[str]:
        """Generate recommendations based on validation results"""
        recommendations = []
        
        for issue in issues:
            if issue["type"] == "calculation_error":
                recommendations.append("🔢 Verify all line item calculations with vendor")
                recommendations.append("📊 Request corrected quote with accurate totals")
            
            elif issue["type"] == "invalid_price":
                recommendations.append("💰 Clarify pricing for items with zero/negative prices")
                recommendations.append("📝 Request firm pricing commitments")
            
            elif issue["type"] == "item_total_mismatch":
                recommendations.append("🧮 Review each line item calculation individually")
                recommendations.append("📋 Ask vendor to provide detailed calculation breakdown")
        
        # Add general recommendations
        if issues:
            recommendations.append("📞 Contact vendor to resolve all calculation discrepancies")
            recommendations.append("✅ Get corrected quote before proceeding with comparison")
        
        if warnings:
            recommendations.append("💡 Review bulk pricing and discount structures")
            recommendations.append("📈 Analyze pricing trends for negotiation opportunities")
        
        return list(set(recommendations))  # Remove duplicates

# Global instance
math_validator = MathValidator()
