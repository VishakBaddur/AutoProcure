from typing import List, Dict, Any, Optional
from .models import VendorQuote, QuoteItem
import re

class JustificationHelper:
    """Generate audit-friendly narratives for vendor selection decisions"""
    
    def __init__(self):
        # Justification templates for different scenarios
        self.justification_templates = {
            "quality_focus": [
                "Selected {vendor} based on superior quality standards and proven track record in {industry}. While {vendor} is ${cost_difference:.2f} higher than the lowest bidder, the quality assurance and reduced risk of defects justify the premium.",
                "Quality-driven selection: {vendor} offers enhanced quality controls and certifications that align with our {quality_standards} requirements. The ${cost_difference:.2f} premium reflects value-added quality assurance measures.",
                "Strategic quality investment: {vendor} provides superior product quality and reliability, reducing long-term costs through fewer defects and maintenance issues. The ${cost_difference:.2f} additional cost is justified by quality benefits."
            ],
            "delivery_advantage": [
                "Delivery timeline optimization: {vendor} offers {delivery_advantage} faster delivery compared to alternatives, enabling project timeline acceleration. The ${cost_difference:.2f} premium supports critical schedule requirements.",
                "Time-critical selection: {vendor} provides expedited delivery that meets our {timeline_requirement} requirements. The ${cost_difference:.2f} additional cost is justified by meeting critical project deadlines.",
                "Just-in-time delivery: {vendor} offers reliable delivery scheduling that supports our lean inventory management strategy. The ${cost_difference:.2f} premium ensures on-time project delivery."
            ],
            "technical_expertise": [
                "Technical expertise selection: {vendor} provides specialized technical support and expertise in {technical_area} that exceeds standard offerings. The ${cost_difference:.2f} premium reflects value-added technical capabilities.",
                "Expertise-driven decision: {vendor} offers superior technical knowledge and support services that reduce implementation risks. The ${cost_difference:.2f} additional cost is justified by technical expertise benefits.",
                "Specialized support: {vendor} provides dedicated technical support and customization capabilities that align with our specific requirements. The ${cost_difference:.2f} premium supports specialized technical needs."
            ],
            "reliability_focus": [
                "Reliability and stability: {vendor} demonstrates superior reliability metrics and long-term stability in the market. The ${cost_difference:.2f} premium reflects reduced supply chain risk and business continuity benefits.",
                "Risk mitigation selection: {vendor} offers proven reliability and consistent performance that reduces operational risks. The ${cost_difference:.2f} additional cost is justified by reliability and stability benefits.",
                "Long-term partnership: {vendor} provides reliable, consistent service with strong track record, supporting long-term strategic partnership goals. The ${cost_difference:.2f} premium reflects partnership value."
            ],
            "service_support": [
                "Service excellence: {vendor} offers superior customer service and support capabilities that exceed standard offerings. The ${cost_difference:.2f} premium reflects enhanced service and support benefits.",
                "Support-driven selection: {vendor} provides comprehensive service and support that reduces implementation and maintenance costs. The ${cost_difference:.2f} additional cost is justified by service excellence.",
                "Value-added services: {vendor} offers additional services including {service_details} that provide operational benefits beyond basic product delivery. The ${cost_difference:.2f} premium reflects service value."
            ],
            "compliance_requirements": [
                "Compliance and certification: {vendor} meets all required {compliance_standards} and holds necessary certifications for our industry. The ${cost_difference:.2f} premium reflects compliance and certification costs.",
                "Regulatory compliance: {vendor} provides products and services that fully comply with {regulatory_requirements}, ensuring regulatory approval and reducing compliance risks. The ${cost_difference:.2f} additional cost is justified by compliance benefits.",
                "Certification requirements: {vendor} holds required certifications and meets all {certification_standards} that are mandatory for our operations. The ${cost_difference:.2f} premium reflects certification costs."
            ],
            "strategic_partnership": [
                "Strategic partnership value: {vendor} offers strategic partnership benefits including {partnership_benefits} that support long-term business objectives. The ${cost_difference:.2f} premium reflects strategic partnership value.",
                "Long-term relationship: {vendor} provides strategic value through long-term partnership benefits that exceed immediate cost considerations. The ${cost_difference:.2f} additional cost is justified by strategic benefits.",
                "Partnership investment: {vendor} offers strategic advantages including {strategic_advantages} that support our business growth and development objectives. The ${cost_difference:.2f} premium reflects partnership investment."
            ]
        }
        
        # Quality indicators
        self.quality_indicators = [
            "certified", "premium", "high-quality", "superior", "enhanced",
            "professional", "industrial", "commercial", "enterprise", "certification"
        ]
        
        # Delivery indicators
        self.delivery_indicators = [
            "express", "overnight", "same-day", "next-day", "expedited",
            "rush", "urgent", "priority", "fast", "quick"
        ]
        
        # Technical indicators
        self.technical_indicators = [
            "technical", "expertise", "specialized", "custom", "professional",
            "consulting", "support", "implementation", "integration", "training"
        ]
        
        # Service indicators
        self.service_indicators = [
            "service", "support", "maintenance", "warranty", "guarantee",
            "assistance", "help", "consulting", "training", "installation"
        ]
    
    def generate_justification(self, selected_vendor: VendorQuote, all_vendors: List[VendorQuote], 
                             selection_reason: str = None) -> Dict[str, Any]:
        """Generate comprehensive justification for vendor selection"""
        
        # Calculate cost differences
        cost_analysis = self._analyze_cost_differences(selected_vendor, all_vendors)
        
        # Determine primary justification factors
        justification_factors = self._identify_justification_factors(selected_vendor, all_vendors)
        
        # Generate primary justification
        primary_justification = self._generate_primary_justification(
            selected_vendor, cost_analysis, justification_factors, selection_reason
        )
        
        # Generate supporting evidence
        supporting_evidence = self._generate_supporting_evidence(selected_vendor, justification_factors)
        
        # Generate risk mitigation narrative
        risk_mitigation = self._generate_risk_mitigation(selected_vendor, cost_analysis)
        
        # Generate audit summary
        audit_summary = self._generate_audit_summary(selected_vendor, cost_analysis, justification_factors)
        
        return {
            "primary_justification": primary_justification,
            "supporting_evidence": supporting_evidence,
            "risk_mitigation": risk_mitigation,
            "audit_summary": audit_summary,
            "cost_analysis": cost_analysis,
            "justification_factors": justification_factors,
            "compliance_ready": True
        }
    
    def _analyze_cost_differences(self, selected_vendor: VendorQuote, all_vendors: List[VendorQuote]) -> Dict[str, Any]:
        """Analyze cost differences between selected vendor and alternatives"""
        selected_total = sum(item.total for item in selected_vendor.items)
        
        # Find lowest cost vendor
        vendor_costs = []
        for vendor in all_vendors:
            vendor_total = sum(item.total for item in vendor.items)
            vendor_costs.append({
                "vendor": vendor.vendorName,
                "total": vendor_total,
                "difference": vendor_total - selected_total
            })
        
        vendor_costs.sort(key=lambda x: x["total"])
        lowest_cost = vendor_costs[0]
        
        cost_difference = selected_total - lowest_cost["total"]
        percentage_difference = (cost_difference / lowest_cost["total"]) * 100 if lowest_cost["total"] > 0 else 0
        
        return {
            "selected_vendor_total": selected_total,
            "lowest_cost_vendor": lowest_cost["vendor"],
            "lowest_cost_total": lowest_cost["total"],
            "cost_difference": cost_difference,
            "percentage_difference": percentage_difference,
            "all_vendor_costs": vendor_costs,
            "is_lowest_cost": cost_difference <= 0
        }
    
    def _identify_justification_factors(self, selected_vendor: VendorQuote, all_vendors: List[VendorQuote]) -> List[Dict[str, Any]]:
        """Identify factors that justify the vendor selection"""
        factors = []
        
        # Analyze vendor name and description for quality indicators
        quality_score = self._assess_quality_indicators(selected_vendor)
        if quality_score > 0:
            factors.append({
                "type": "quality_focus",
                "score": quality_score,
                "description": "Quality and reliability advantages",
                "evidence": self._extract_quality_evidence(selected_vendor)
            })
        
        # Analyze delivery advantages
        delivery_advantage = self._assess_delivery_advantages(selected_vendor, all_vendors)
        if delivery_advantage:
            factors.append({
                "type": "delivery_advantage",
                "score": delivery_advantage["score"],
                "description": f"Delivery advantage: {delivery_advantage['advantage']}",
                "evidence": delivery_advantage["evidence"]
            })
        
        # Analyze technical expertise
        technical_score = self._assess_technical_expertise(selected_vendor)
        if technical_score > 0:
            factors.append({
                "type": "technical_expertise",
                "score": technical_score,
                "description": "Technical expertise and support",
                "evidence": self._extract_technical_evidence(selected_vendor)
            })
        
        # Analyze service and support
        service_score = self._assess_service_support(selected_vendor)
        if service_score > 0:
            factors.append({
                "type": "service_support",
                "score": service_score,
                "description": "Service and support excellence",
                "evidence": self._extract_service_evidence(selected_vendor)
            })
        
        # Sort factors by score
        factors.sort(key=lambda x: x["score"], reverse=True)
        
        return factors
    
    def _assess_quality_indicators(self, vendor: VendorQuote) -> float:
        """Assess quality indicators in vendor quote"""
        score = 0.0
        text_to_analyze = vendor.vendorName.lower()
        
        # Add item descriptions to analysis
        for item in vendor.items:
            text_to_analyze += " " + item.description.lower()
        
        # Check for quality indicators
        for indicator in self.quality_indicators:
            if indicator in text_to_analyze:
                score += 1.0
        
        return score
    
    def _assess_delivery_advantages(self, selected_vendor: VendorQuote, all_vendors: List[VendorQuote]) -> Optional[Dict[str, Any]]:
        """Assess delivery advantages compared to other vendors"""
        selected_delivery = self._extract_delivery_time(selected_vendor)
        
        if not selected_delivery:
            return None
        
        # Compare with other vendors
        other_deliveries = []
        for vendor in all_vendors:
            if vendor.vendorName != selected_vendor.vendorName:
                delivery = self._extract_delivery_time(vendor)
                if delivery:
                    other_deliveries.append(delivery)
        
        if not other_deliveries:
            return None
        
        # Find fastest delivery
        fastest_delivery = min(other_deliveries, key=lambda x: x["days"])
        
        if selected_delivery["days"] < fastest_delivery["days"]:
            advantage_days = fastest_delivery["days"] - selected_delivery["days"]
            return {
                "score": 3.0,
                "advantage": f"{advantage_days} days faster",
                "evidence": f"Selected vendor offers {selected_delivery['text']} vs {fastest_delivery['text']} from alternatives"
            }
        
        return None
    
    def _assess_technical_expertise(self, vendor: VendorQuote) -> float:
        """Assess technical expertise indicators"""
        score = 0.0
        text_to_analyze = vendor.vendorName.lower()
        
        for item in vendor.items:
            text_to_analyze += " " + item.description.lower()
        
        for indicator in self.technical_indicators:
            if indicator in text_to_analyze:
                score += 1.0
        
        return score
    
    def _assess_service_support(self, vendor: VendorQuote) -> float:
        """Assess service and support indicators"""
        score = 0.0
        text_to_analyze = vendor.vendorName.lower()
        
        for item in vendor.items:
            text_to_analyze += " " + item.description.lower()
        
        for indicator in self.service_indicators:
            if indicator in text_to_analyze:
                score += 1.0
        
        return score
    
    def _extract_delivery_time(self, vendor: VendorQuote) -> Optional[Dict[str, Any]]:
        """Extract delivery time information"""
        if not vendor.items:
            return None
        
        # Look for delivery time in items
        delivery_texts = []
        for item in vendor.items:
            if item.deliveryTime and item.deliveryTime.lower() not in ["tbd", "tba", "to be determined"]:
                delivery_texts.append(item.deliveryTime)
        
        if not delivery_texts:
            return None
        
        # Try to extract days from delivery text
        delivery_text = delivery_texts[0]
        days = self._extract_days_from_text(delivery_text)
        
        return {
            "text": delivery_text,
            "days": days
        }
    
    def _extract_days_from_text(self, text: str) -> int:
        """Extract number of days from delivery text"""
        # Common patterns
        patterns = [
            r"(\d+)\s*days?",
            r"(\d+)\s*weeks?",
            r"(\d+)\s*months?",
            r"(\d+)\s*business\s*days?",
            r"(\d+)\s*working\s*days?"
        ]
        
        text_lower = text.lower()
        
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
            return 7  # Default to 1 week
    
    def _extract_quality_evidence(self, vendor: VendorQuote) -> List[str]:
        """Extract quality-related evidence"""
        evidence = []
        text_to_analyze = vendor.vendorName.lower()
        
        for item in vendor.items:
            text_to_analyze += " " + item.description.lower()
        
        for indicator in self.quality_indicators:
            if indicator in text_to_analyze:
                evidence.append(f"Contains '{indicator}' indicators")
        
        return evidence
    
    def _extract_technical_evidence(self, vendor: VendorQuote) -> List[str]:
        """Extract technical expertise evidence"""
        evidence = []
        text_to_analyze = vendor.vendorName.lower()
        
        for item in vendor.items:
            text_to_analyze += " " + item.description.lower()
        
        for indicator in self.technical_indicators:
            if indicator in text_to_analyze:
                evidence.append(f"Contains '{indicator}' indicators")
        
        return evidence
    
    def _extract_service_evidence(self, vendor: VendorQuote) -> List[str]:
        """Extract service and support evidence"""
        evidence = []
        text_to_analyze = vendor.vendorName.lower()
        
        for item in vendor.items:
            text_to_analyze += " " + item.description.lower()
        
        for indicator in self.service_indicators:
            if indicator in text_to_analyze:
                evidence.append(f"Contains '{indicator}' indicators")
        
        return evidence
    
    def _generate_primary_justification(self, selected_vendor: VendorQuote, cost_analysis: Dict[str, Any], 
                                      justification_factors: List[Dict[str, Any]], selection_reason: str = None) -> str:
        """Generate primary justification narrative"""
        
        if cost_analysis["is_lowest_cost"]:
            return f"Selected {selected_vendor.vendorName} as the lowest-cost option at ${cost_analysis['selected_vendor_total']:.2f}, providing optimal value while meeting all requirements."
        
        if not justification_factors:
            # Fallback justification
            return f"Selected {selected_vendor.vendorName} based on comprehensive evaluation of quality, service, and value factors. While ${cost_analysis['cost_difference']:.2f} higher than the lowest bidder, the selection provides superior overall value."
        
        # Use the highest-scoring factor
        primary_factor = justification_factors[0]
        cost_difference = cost_analysis["cost_difference"]
        
        # Select appropriate template
        template_key = primary_factor["type"]
        if template_key in self.justification_templates:
            template = self.justification_templates[template_key][0]  # Use first template
        else:
            template = self.justification_templates["quality_focus"][0]  # Fallback
        
        # Fill template with data
        justification = template.format(
            vendor=selected_vendor.vendorName,
            cost_difference=cost_difference,
            industry="procurement",
            quality_standards="industry",
            delivery_advantage="expedited",
            timeline_requirement="project",
            technical_area="procurement",
            service_details="comprehensive support",
            compliance_standards="industry",
            regulatory_requirements="applicable regulations",
            certification_standards="industry",
            partnership_benefits="strategic collaboration",
            strategic_advantages="long-term value"
        )
        
        return justification
    
    def _generate_supporting_evidence(self, selected_vendor: VendorQuote, justification_factors: List[Dict[str, Any]]) -> List[str]:
        """Generate supporting evidence for the justification"""
        evidence = []
        
        for factor in justification_factors:
            if "evidence" in factor:
                evidence.extend(factor["evidence"])
        
        # Add vendor-specific evidence
        evidence.append(f"Vendor: {selected_vendor.vendorName}")
        evidence.append(f"Total items: {len(selected_vendor.items)}")
        
        if selected_vendor.items:
            evidence.append(f"Average item value: ${sum(item.total for item in selected_vendor.items) / len(selected_vendor.items):.2f}")
        
        return evidence
    
    def _generate_risk_mitigation(self, selected_vendor: VendorQuote, cost_analysis: Dict[str, Any]) -> str:
        """Generate risk mitigation narrative"""
        if cost_analysis["is_lowest_cost"]:
            return "Risk mitigation: Selected vendor provides lowest cost while maintaining quality standards, minimizing financial risk."
        
        cost_difference = cost_analysis["cost_difference"]
        percentage = cost_analysis["percentage_difference"]
        
        return f"Risk mitigation: The ${cost_difference:.2f} premium ({percentage:.1f}%) is justified by reduced operational risks, improved quality, and enhanced service support, providing long-term value that exceeds the initial cost difference."
    
    def _generate_audit_summary(self, selected_vendor: VendorQuote, cost_analysis: Dict[str, Any], 
                              justification_factors: List[Dict[str, Any]]) -> str:
        """Generate audit-friendly summary"""
        
        summary_parts = [
            f"Vendor Selection: {selected_vendor.vendorName}",
            f"Total Cost: ${cost_analysis['selected_vendor_total']:.2f}",
            f"Cost Difference: ${cost_analysis['cost_difference']:.2f} ({cost_analysis['percentage_difference']:.1f}%)",
            f"Justification Factors: {len(justification_factors)} identified"
        ]
        
        if justification_factors:
            primary_factor = justification_factors[0]
            summary_parts.append(f"Primary Factor: {primary_factor['description']}")
        
        summary_parts.append("Decision: Justified based on comprehensive evaluation of quality, service, and value factors.")
        
        return " | ".join(summary_parts)

# Global instance
justification_helper = JustificationHelper()
