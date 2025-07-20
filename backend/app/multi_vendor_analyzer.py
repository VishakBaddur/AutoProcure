import json
from typing import List, Dict, Any, Optional
from .models import VendorQuote, VendorRecommendation, MultiVendorAnalysis
from .ai_processor import ai_processor

class MultiVendorAnalyzer:
    """Intelligent multi-vendor analysis and recommendation engine"""
    
    def __init__(self):
        self.ai_processor = ai_processor
    
    async def analyze_multiple_quotes(self, quotes: List[VendorQuote], rag_context: str = None) -> MultiVendorAnalysis:
        """
        Analyze multiple vendor quotes and provide intelligent recommendations
        for optimal vendor selection and cost optimization.
        """
        try:
            # Create comprehensive analysis prompt
            prompt = self._create_multi_vendor_prompt(quotes, rag_context)
            
            # Get AI analysis
            response = await self.ai_processor._call_ollama(prompt)
            analysis_data = self._parse_multi_vendor_response(response)
            
            # Generate vendor recommendations
            vendor_recommendations = self._generate_vendor_recommendations(quotes, analysis_data)
            
            # Calculate cost savings
            cost_savings = self._calculate_cost_savings(quotes, vendor_recommendations)
            
            # Create risk assessment
            risk_assessment = self._assess_risks(quotes, vendor_recommendations)
            
            # Generate overall recommendation
            recommendation = self._generate_overall_recommendation(quotes, vendor_recommendations, cost_savings)
            
            return MultiVendorAnalysis(
                quotes=quotes,
                comparison=analysis_data.get("comparison", {}),
                recommendation=recommendation,
                vendor_recommendations=vendor_recommendations,
                cost_savings=cost_savings,
                risk_assessment=risk_assessment
            )
            
        except Exception as e:
            print(f"Multi-vendor analysis failed: {str(e)}")
            # Fallback to basic analysis
            return self._get_fallback_analysis(quotes)
    
    def _create_multi_vendor_prompt(self, quotes: List[VendorQuote], rag_context: str = None) -> str:
        """Create detailed prompt for multi-vendor analysis"""
        
        # Build vendor data for analysis
        vendor_data = []
        for i, quote in enumerate(quotes):
            vendor_info = {
                "vendor_name": quote.vendorName,
                "items": [
                    {
                        "sku": item.sku,
                        "description": item.description,
                        "quantity": item.quantity,
                        "unit_price": item.unitPrice,
                        "total": item.total,
                        "delivery_time": item.deliveryTime
                    } for item in quote.items
                ],
                "terms": {
                    "payment": quote.terms.payment,
                    "warranty": quote.terms.warranty
                },
                "reliability_score": quote.reliability_score or 0.7,
                "delivery_rating": quote.delivery_rating or "Good",
                "quality_rating": quote.quality_rating or "Good"
            }
            vendor_data.append(vendor_info)
        
        context_section = f"""
RELEVANT PAST QUOTES AND CONTEXT:
{rag_context}
""" if rag_context else ""
        
        return f"""You are an expert procurement analyst specializing in multi-vendor optimization. Analyze the following vendor quotes and provide intelligent recommendations for optimal vendor selection.

{context_section}

VENDOR QUOTES:
{json.dumps(vendor_data, indent=2)}

Analyze these quotes and provide:

1. **Vendor Comparison**: Compare pricing, delivery times, terms, and reliability
2. **Optimal Vendor Selection**: Recommend which vendor(s) to use for each item
3. **Cost Optimization**: Identify potential savings through strategic vendor selection
4. **Risk Assessment**: Evaluate risks of multi-vendor approach vs single vendor
5. **Strategic Recommendations**: Provide actionable procurement strategy

Return ONLY a valid JSON object:

{{
  "comparison": {{
    "total_vendors": 3,
    "price_variance": "15%",
    "delivery_variance": "5-15 days",
    "best_overall_vendor": "Vendor Name",
    "cost_savings_potential": 1500.00
  }},
  "vendor_recommendations": [
    {{
      "vendor_name": "Vendor A",
      "items_to_purchase": ["SKU1", "SKU2"],
      "total_cost": 2500.00,
      "delivery_time": "7 days",
      "reasoning": "Best price for electronics, reliable delivery",
      "reliability_score": 0.85
    }}
  ],
  "strategic_insights": [
    "Vendor A excels in electronics with 15% lower pricing",
    "Vendor B offers fastest delivery for urgent items",
    "Consider splitting order to optimize cost and delivery"
  ],
  "risk_factors": [
    "Multiple vendors increase coordination complexity",
    "Quality consistency across vendors",
    "Payment terms vary significantly"
  ]
}}

IMPORTANT RULES:
1. Focus on cost optimization while maintaining quality
2. Consider delivery times and reliability
3. Balance single vs multi-vendor risks
4. Provide specific, actionable recommendations
5. Return ONLY the JSON object, no other text

JSON Response:"""
    
    def _parse_multi_vendor_response(self, response: str) -> Dict[str, Any]:
        """Parse AI response for multi-vendor analysis"""
        try:
            response = response.strip()
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
    
    def _generate_vendor_recommendations(self, quotes: List[VendorQuote], analysis_data: Dict[str, Any]) -> List[VendorRecommendation]:
        """Generate vendor recommendations based on AI analysis"""
        recommendations = []
        
        vendor_recs = analysis_data.get("vendor_recommendations", [])
        for rec in vendor_recs:
            recommendation = VendorRecommendation(
                vendor_name=rec.get("vendor_name", "Unknown"),
                items_to_purchase=rec.get("items_to_purchase", []),
                total_cost=rec.get("total_cost", 0.0),
                delivery_time=rec.get("delivery_time", "TBD"),
                reasoning=rec.get("reasoning", "No reasoning provided"),
                reliability_score=rec.get("reliability_score", 0.7)
            )
            recommendations.append(recommendation)
        
        return recommendations
    
    def _calculate_cost_savings(self, quotes: List[VendorQuote], recommendations: List[VendorRecommendation]) -> float:
        """Calculate potential cost savings from optimal vendor selection"""
        if not quotes or not recommendations:
            return 0.0
        
        # Calculate total cost if buying everything from cheapest single vendor
        single_vendor_costs = []
        for quote in quotes:
            total_cost = sum(item.total for item in quote.items)
            single_vendor_costs.append(total_cost)
        
        cheapest_single_vendor = min(single_vendor_costs)
        
        # Calculate total cost from recommendations
        recommended_total = sum(rec.total_cost for rec in recommendations)
        
        # Calculate savings
        savings = cheapest_single_vendor - recommended_total
        return max(0.0, savings)  # No negative savings
    
    def _assess_risks(self, quotes: List[VendorQuote], recommendations: List[VendorRecommendation]) -> str:
        """Assess risks of multi-vendor approach"""
        if len(recommendations) <= 1:
            return "Low risk - Single vendor approach"
        
        risk_factors = []
        
        # Multiple vendors increase complexity
        if len(recommendations) > 2:
            risk_factors.append("High coordination complexity with multiple vendors")
        
        # Check delivery time variance
        delivery_times = [rec.delivery_time for rec in recommendations]
        if len(set(delivery_times)) > 1:
            risk_factors.append("Inconsistent delivery times across vendors")
        
        # Check reliability variance
        reliability_scores = [rec.reliability_score for rec in recommendations]
        if max(reliability_scores) - min(reliability_scores) > 0.3:
            risk_factors.append("Significant reliability variance among vendors")
        
        if risk_factors:
            return "Medium risk: " + "; ".join(risk_factors)
        else:
            return "Low risk - Well-balanced vendor selection"
    
    def _generate_overall_recommendation(self, quotes: List[VendorQuote], recommendations: List[VendorRecommendation], cost_savings: float) -> str:
        """Generate overall strategic recommendation"""
        if len(recommendations) == 1:
            vendor = recommendations[0]
            return f"Recommend single vendor approach: {vendor.vendor_name} offers best overall value at ${vendor.total_cost:,.2f}"
        
        total_recommended_cost = sum(rec.total_cost for rec in recommendations)
        savings_percentage = (cost_savings / total_recommended_cost * 100) if total_recommended_cost > 0 else 0
        
        vendor_names = [rec.vendor_name for rec in recommendations]
        
        return f"Multi-vendor strategy recommended: Split order between {', '.join(vendor_names)} for ${total_recommended_cost:,.2f} total (${cost_savings:,.2f} savings, {savings_percentage:.1f}% reduction)"
    
    def _get_fallback_analysis(self, quotes: List[VendorQuote]) -> MultiVendorAnalysis:
        """Fallback analysis when AI fails"""
        if not quotes:
            return MultiVendorAnalysis(
                quotes=[],
                comparison={},
                recommendation="No quotes to analyze",
                vendor_recommendations=[],
                cost_savings=0.0,
                risk_assessment="No data available"
            )
        
        # Simple fallback: recommend cheapest vendor
        cheapest_quote = min(quotes, key=lambda q: sum(item.total for item in q.items))
        total_cost = sum(item.total for item in cheapest_quote.items)
        
        recommendation = VendorRecommendation(
            vendor_name=cheapest_quote.vendorName,
            items_to_purchase=[item.sku for item in cheapest_quote.items],
            total_cost=total_cost,
            delivery_time=cheapest_quote.items[0].deliveryTime if cheapest_quote.items else "TBD",
            reasoning="Lowest total cost among available quotes",
            reliability_score=0.7
        )
        
        return MultiVendorAnalysis(
            quotes=quotes,
            comparison={"total_vendors": len(quotes), "best_vendor": cheapest_quote.vendorName},
            recommendation=f"Recommend {cheapest_quote.vendorName} for lowest total cost: ${total_cost:,.2f}",
            vendor_recommendations=[recommendation],
            cost_savings=0.0,
            risk_assessment="Standard single vendor risk"
        )

# Global instance
multi_vendor_analyzer = MultiVendorAnalyzer() 