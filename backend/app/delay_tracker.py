import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from .models import VendorQuote, QuoteItem

class DelayTracker:
    """Track and identify timeline bottlenecks and delays in procurement process"""
    
    def __init__(self):
        # Delay indicators and patterns
        self.delay_patterns = {
            "terms_conditions": [
                r"awaiting\s+t&c",
                r"awaiting\s+terms",
                r"awaiting\s+conditions",
                r"pending\s+terms",
                r"pending\s+conditions",
                r"terms\s+under\s+review",
                r"conditions\s+under\s+review",
                r"legal\s+review",
                r"contract\s+review",
                r"agreement\s+review"
            ],
            "approval_delays": [
                r"awaiting\s+approval",
                r"pending\s+approval",
                r"approval\s+required",
                r"management\s+approval",
                r"executive\s+approval",
                r"board\s+approval",
                r"stakeholder\s+approval",
                r"budget\s+approval",
                r"finance\s+approval"
            ],
            "documentation_delays": [
                r"awaiting\s+documentation",
                r"pending\s+documentation",
                r"missing\s+documents",
                r"incomplete\s+documentation",
                r"documentation\s+required",
                r"certificates\s+required",
                r"licenses\s+required",
                r"permits\s+required"
            ],
            "payment_terms": [
                r"payment\s+terms\s+negotiation",
                r"credit\s+terms",
                r"payment\s+schedule",
                r"billing\s+terms",
                r"invoicing\s+terms",
                r"payment\s+method",
                r"credit\s+approval",
                r"payment\s+approval"
            ],
            "technical_reviews": [
                r"technical\s+review",
                r"engineering\s+review",
                r"specification\s+review",
                r"design\s+review",
                r"quality\s+review",
                r"compliance\s+review",
                r"safety\s+review",
                r"performance\s+review"
            ],
            "supplier_qualification": [
                r"supplier\s+qualification",
                r"vendor\s+qualification",
                r"pre-qualification",
                r"certification\s+process",
                r"audit\s+process",
                r"evaluation\s+process",
                r"onboarding\s+process"
            ]
        }
        
        # Timeline blockers
        self.timeline_blockers = [
            "TBD", "TBA", "To be determined", "To be advised",
            "Under review", "Pending", "Awaiting", "In progress",
            "Processing", "Evaluating", "Assessing"
        ]
        
        # Critical delay indicators
        self.critical_delays = [
            "urgent", "critical", "emergency", "rush", "expedited",
            "immediate", "asap", "priority", "high priority"
        ]
    
    def analyze_timeline_risks(self, quotes: List[VendorQuote], raw_texts: List[str] = None) -> Dict[str, Any]:
        """Analyze timeline risks and identify potential delays"""
        
        timeline_analysis = {
            "overall_risk_level": "low",
            "total_delays": 0,
            "critical_delays": 0,
            "delays_by_vendor": {},
            "delays_by_category": {},
            "timeline_blockers": [],
            "recommendations": [],
            "estimated_impact": "minimal"
        }
        
        total_delays = 0
        critical_delays = 0
        
        # Analyze each quote
        for i, quote in enumerate(quotes):
            raw_text = raw_texts[i] if raw_texts and i < len(raw_texts) else ""
            vendor_analysis = self._analyze_vendor_timeline(quote, raw_text)
            
            timeline_analysis["delays_by_vendor"][quote.vendorName] = vendor_analysis
            total_delays += vendor_analysis["total_delays"]
            critical_delays += vendor_analysis["critical_delays"]
        
        # Aggregate delays by category
        timeline_analysis["delays_by_category"] = self._aggregate_delays_by_category(timeline_analysis["delays_by_vendor"])
        
        # Identify timeline blockers
        timeline_analysis["timeline_blockers"] = self._identify_timeline_blockers(quotes, raw_texts)
        
        # Calculate overall risk level
        timeline_analysis["total_delays"] = total_delays
        timeline_analysis["critical_delays"] = critical_delays
        timeline_analysis["overall_risk_level"] = self._calculate_risk_level(total_delays, critical_delays)
        
        # Generate recommendations
        timeline_analysis["recommendations"] = self._generate_timeline_recommendations(timeline_analysis)
        
        # Estimate impact
        timeline_analysis["estimated_impact"] = self._estimate_timeline_impact(timeline_analysis)
        
        return timeline_analysis
    
    def _analyze_vendor_timeline(self, quote: VendorQuote, raw_text: str = "") -> Dict[str, Any]:
        """Analyze timeline risks for a specific vendor"""
        
        delays = []
        critical_delays = 0
        
        # Check for delay patterns in text
        text_delays = self._detect_delay_patterns(raw_text)
        delays.extend(text_delays)
        
        # Check for timeline blockers in items
        item_delays = self._detect_item_delays(quote.items)
        delays.extend(item_delays)
        
        # Check for delivery time issues
        delivery_delays = self._analyze_delivery_times(quote.items)
        delays.extend(delivery_delays)
        
        # Count critical delays
        critical_delays = len([d for d in delays if d.get("severity") == "critical"])
        
        # Calculate risk score
        risk_score = self._calculate_vendor_risk_score(delays)
        
        return {
            "total_delays": len(delays),
            "critical_delays": critical_delays,
            "delays": delays,
            "risk_score": risk_score,
            "risk_level": self._get_risk_level_from_score(risk_score),
            "estimated_delay_days": self._estimate_delay_days(delays)
        }
    
    def _detect_delay_patterns(self, text: str) -> List[Dict[str, Any]]:
        """Detect delay patterns in text"""
        delays = []
        text_lower = text.lower()
        
        for category, patterns in self.delay_patterns.items():
            for pattern in patterns:
                matches = re.findall(pattern, text_lower)
                if matches:
                    severity = self._determine_delay_severity(category, matches[0])
                    delays.append({
                        "type": category,
                        "severity": severity,
                        "description": f"Detected {category.replace('_', ' ')} delay",
                        "pattern": pattern,
                        "match": matches[0],
                        "recommendation": self._get_delay_recommendation(category)
                    })
        
        return delays
    
    def _detect_item_delays(self, items: List[QuoteItem]) -> List[Dict[str, Any]]:
        """Detect delays in item delivery times"""
        delays = []
        
        for item in items:
            if not item.deliveryTime:
                continue
            
            delivery_text = item.deliveryTime.lower()
            
            # Check for timeline blockers
            for blocker in self.timeline_blockers:
                if blocker.lower() in delivery_text:
                    delays.append({
                        "type": "delivery_blocker",
                        "severity": "high",
                        "description": f"Delivery time blocked: {item.deliveryTime}",
                        "item": item.description,
                        "recommendation": "Request firm delivery commitment from vendor"
                    })
                    break
            
            # Check for critical delays
            for critical in self.critical_delays:
                if critical in delivery_text:
                    delays.append({
                        "type": "critical_delivery",
                        "severity": "critical",
                        "description": f"Critical delivery requirement: {item.deliveryTime}",
                        "item": item.description,
                        "recommendation": "Prioritize this item and confirm expedited delivery"
                    })
                    break
        
        return delays
    
    def _analyze_delivery_times(self, items: List[QuoteItem]) -> List[Dict[str, Any]]:
        """Analyze delivery times for potential issues"""
        delays = []
        
        if not items:
            return delays
        
        # Extract delivery times
        delivery_times = []
        for item in items:
            if item.deliveryTime and item.deliveryTime.lower() not in ["tbd", "tba", "to be determined"]:
                days = self._extract_days_from_delivery(item.deliveryTime)
                if days:
                    delivery_times.append({
                        "item": item.description,
                        "days": days,
                        "text": item.deliveryTime
                    })
        
        if not delivery_times:
            return delays
        
        # Check for delivery time inconsistencies
        if len(delivery_times) > 1:
            min_days = min(dt["days"] for dt in delivery_times)
            max_days = max(dt["days"] for dt in delivery_times)
            
            if max_days - min_days > 14:  # More than 2 weeks difference
                delays.append({
                    "type": "delivery_inconsistency",
                    "severity": "medium",
                    "description": f"Significant delivery time variation: {min_days} to {max_days} days",
                    "details": f"Items range from {min_days} days to {max_days} days delivery",
                    "recommendation": "Clarify delivery schedule and consider splitting order"
                })
        
        # Check for very long delivery times
        long_deliveries = [dt for dt in delivery_times if dt["days"] > 30]
        if long_deliveries:
            delays.append({
                "type": "long_delivery",
                "severity": "medium",
                "description": f"Long delivery times detected: {len(long_deliveries)} items over 30 days",
                "details": [f"{dt['item']}: {dt['text']}" for dt in long_deliveries],
                "recommendation": "Consider alternative vendors or expedited shipping options"
            })
        
        return delays
    
    def _extract_days_from_delivery(self, delivery_text: str) -> Optional[int]:
        """Extract number of days from delivery text"""
        patterns = [
            r"(\d+)\s*days?",
            r"(\d+)\s*weeks?",
            r"(\d+)\s*months?",
            r"(\d+)\s*business\s*days?",
            r"(\d+)\s*working\s*days?"
        ]
        
        text_lower = delivery_text.lower()
        
        for pattern in patterns:
            match = re.search(pattern, text_lower)
            if match:
                number = int(match.group(1))
                if "week" in text_lower:
                    return number * 7
                elif "month" in text_lower:
                    return number * 30
                else:
                    return number
        
        # Default estimates
        if "same day" in text_lower or "overnight" in text_lower:
            return 1
        elif "next day" in text_lower:
            return 2
        elif "express" in text_lower or "rush" in text_lower:
            return 3
        else:
            return None
    
    def _determine_delay_severity(self, category: str, match: str) -> str:
        """Determine severity of delay based on category and context"""
        if category in ["approval_delays", "terms_conditions"]:
            return "high"
        elif category in ["critical_delivery", "payment_terms"]:
            return "medium"
        else:
            return "low"
    
    def _get_delay_recommendation(self, category: str) -> str:
        """Get recommendation for delay category"""
        recommendations = {
            "terms_conditions": "Expedite legal review and establish clear timeline for T&C approval",
            "approval_delays": "Escalate to appropriate approvers and set clear approval timeline",
            "documentation_delays": "Request missing documentation immediately and set deadlines",
            "payment_terms": "Negotiate payment terms upfront and document agreement",
            "technical_reviews": "Schedule technical review sessions and set review deadlines",
            "supplier_qualification": "Accelerate qualification process or consider pre-qualified vendors"
        }
        
        return recommendations.get(category, "Address delay promptly to avoid timeline impact")
    
    def _calculate_vendor_risk_score(self, delays: List[Dict[str, Any]]) -> int:
        """Calculate risk score for vendor (0-100)"""
        if not delays:
            return 0
        
        score = 0
        for delay in delays:
            if delay.get("severity") == "critical":
                score += 30
            elif delay.get("severity") == "high":
                score += 20
            elif delay.get("severity") == "medium":
                score += 10
            else:
                score += 5
        
        return min(100, score)
    
    def _get_risk_level_from_score(self, score: int) -> str:
        """Get risk level from score"""
        if score >= 70:
            return "critical"
        elif score >= 40:
            return "high"
        elif score >= 20:
            return "medium"
        else:
            return "low"
    
    def _estimate_delay_days(self, delays: List[Dict[str, Any]]) -> int:
        """Estimate total delay days"""
        total_days = 0
        
        for delay in delays:
            if delay.get("type") == "terms_conditions":
                total_days += 7  # 1 week for T&C review
            elif delay.get("type") == "approval_delays":
                total_days += 5  # 5 days for approval
            elif delay.get("type") == "documentation_delays":
                total_days += 3  # 3 days for documentation
            elif delay.get("type") == "delivery_blocker":
                total_days += 10  # 10 days for delivery commitment
            elif delay.get("type") == "long_delivery":
                total_days += 15  # 15 days for expedited options
        
        return total_days
    
    def _aggregate_delays_by_category(self, vendor_delays: Dict[str, Any]) -> Dict[str, Any]:
        """Aggregate delays by category across all vendors"""
        category_counts = {}
        
        for vendor_name, analysis in vendor_delays.items():
            for delay in analysis.get("delays", []):
                delay_type = delay.get("type", "unknown")
                if delay_type not in category_counts:
                    category_counts[delay_type] = {
                        "count": 0,
                        "vendors": [],
                        "severity_breakdown": {"critical": 0, "high": 0, "medium": 0, "low": 0}
                    }
                
                category_counts[delay_type]["count"] += 1
                if vendor_name not in category_counts[delay_type]["vendors"]:
                    category_counts[delay_type]["vendors"].append(vendor_name)
                
                severity = delay.get("severity", "low")
                category_counts[delay_type]["severity_breakdown"][severity] += 1
        
        return category_counts
    
    def _identify_timeline_blockers(self, quotes: List[VendorQuote], raw_texts: List[str] = None) -> List[Dict[str, Any]]:
        """Identify major timeline blockers across all vendors"""
        blockers = []
        
        # Check for common blockers across vendors
        common_blockers = set()
        
        for i, quote in enumerate(quotes):
            raw_text = raw_texts[i] if raw_texts and i < len(raw_texts) else ""
            text_lower = raw_text.lower()
            
            for blocker in self.timeline_blockers:
                if blocker.lower() in text_lower:
                    common_blockers.add(blocker)
        
        # Create blocker entries
        for blocker in common_blockers:
            affected_vendors = []
            for i, quote in enumerate(quotes):
                raw_text = raw_texts[i] if raw_texts and i < len(raw_texts) else ""
                if blocker.lower() in raw_text.lower():
                    affected_vendors.append(quote.vendorName)
            
            blockers.append({
                "blocker": blocker,
                "affected_vendors": affected_vendors,
                "impact": "high" if len(affected_vendors) > 1 else "medium",
                "recommendation": f"Address {blocker} issue across all affected vendors"
            })
        
        return blockers
    
    def _calculate_risk_level(self, total_delays: int, critical_delays: int) -> str:
        """Calculate overall risk level"""
        if critical_delays > 0:
            return "critical"
        elif total_delays > 5:
            return "high"
        elif total_delays > 2:
            return "medium"
        else:
            return "low"
    
    def _generate_timeline_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """Generate timeline recommendations"""
        recommendations = []
        
        if analysis["overall_risk_level"] == "critical":
            recommendations.append("🚨 IMMEDIATE ACTION REQUIRED: Address critical delays to prevent project timeline impact")
            recommendations.append("📞 Escalate to senior management and establish daily status updates")
        
        if analysis["critical_delays"] > 0:
            recommendations.append(f"⚠️ {analysis['critical_delays']} critical delays detected - prioritize resolution")
        
        # Category-specific recommendations
        for category, data in analysis["delays_by_category"].items():
            if data["count"] > 1:
                recommendations.append(f"📋 Address {category.replace('_', ' ')} delays across {len(data['vendors'])} vendors")
        
        # Timeline blocker recommendations
        for blocker in analysis["timeline_blockers"]:
            if blocker["impact"] == "high":
                recommendations.append(f"🔒 Resolve {blocker['blocker']} issue affecting {len(blocker['affected_vendors'])} vendors")
        
        # General recommendations
        if analysis["total_delays"] > 0:
            recommendations.append("📅 Establish clear timelines and milestones for all pending items")
            recommendations.append("📊 Create weekly timeline status reports")
            recommendations.append("🤝 Assign dedicated resources to resolve delays")
        
        return recommendations
    
    def _estimate_timeline_impact(self, analysis: Dict[str, Any]) -> str:
        """Estimate timeline impact"""
        total_delay_days = sum(
            vendor_analysis.get("estimated_delay_days", 0) 
            for vendor_analysis in analysis["delays_by_vendor"].values()
        )
        
        if analysis["overall_risk_level"] == "critical":
            return f"Critical impact: {total_delay_days}+ days potential delay"
        elif analysis["overall_risk_level"] == "high":
            return f"High impact: {total_delay_days}+ days potential delay"
        elif analysis["overall_risk_level"] == "medium":
            return f"Medium impact: {total_delay_days}+ days potential delay"
        else:
            return "Minimal impact: Timeline appears manageable"

# Global instance
delay_tracker = DelayTracker()
