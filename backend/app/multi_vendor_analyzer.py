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
            # Generate vendor recommendations
            vendor_recommendations = self._generate_vendor_recommendations(quotes)
            
            # Calculate cost savings
            cost_savings = self._calculate_cost_savings(quotes, vendor_recommendations)
            
            # Create risk assessment
            risk_assessment = self._assess_risks(quotes, vendor_recommendations)
            
            # Generate overall recommendation
            recommendation = self._generate_overall_recommendation(quotes, vendor_recommendations, cost_savings)
            
            # Create comparison matrix
            comparison = self._create_comparison_matrix(quotes, vendor_recommendations)
            
            return MultiVendorAnalysis(
                quotes=quotes,
                comparison=comparison,
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
    
    def _generate_vendor_recommendations(self, quotes: List[VendorQuote]) -> List[VendorRecommendation]:
        """Generate intelligent vendor recommendations with winner badges"""
        recommendations = []
        
        # Calculate total costs for each vendor
        vendor_costs = {}
        for quote in quotes:
            total_cost = sum(item.total for item in quote.items)
            vendor_costs[quote.vendorName] = total_cost
        
        # Filter out vendors with $0.00 total (extraction failure)
        valid_vendor_costs = {k: v for k, v in vendor_costs.items() if v > 0}
        
        if not valid_vendor_costs:
            # All vendors have $0.00 - return fallback
            return self._get_fallback_analysis(quotes)
        
        # Find the cheapest vendor among valid vendors
        cheapest_vendor = min(valid_vendor_costs, key=valid_vendor_costs.get)
        cheapest_cost = valid_vendor_costs[cheapest_vendor]
        
        # Generate recommendations for each vendor
        for quote in quotes:
            total_cost = vendor_costs[quote.vendorName]
            cost_difference = total_cost - cheapest_cost
            cost_percentage = (cost_difference / cheapest_cost * 100) if cheapest_cost > 0 else 0
            
            # Determine recommendation type
            if quote.vendorName == cheapest_vendor:
                recommendation_type = "WINNER"
                recommendation_reason = "Lowest total cost"
                badge_color = "green"
            elif cost_percentage <= 10:
                recommendation_type = "GOOD"
                recommendation_reason = f"Only {cost_percentage:.1f}% more than cheapest"
                badge_color = "blue"
            elif cost_percentage <= 25:
                recommendation_type = "ACCEPTABLE"
                recommendation_reason = f"{cost_percentage:.1f}% higher than cheapest"
                badge_color = "yellow"
            else:
                recommendation_type = "EXPENSIVE"
                recommendation_reason = f"{cost_percentage:.1f}% higher than cheapest"
                badge_color = "red"
            
            # Generate detailed analysis
            analysis = self._analyze_vendor_strengths(quote, cheapest_cost)
            
            recommendations.append(VendorRecommendation(
                vendor_name=quote.vendorName,
                recommendation_type=recommendation_type,
                recommendation_reason=recommendation_reason,
                total_cost=total_cost,
                cost_difference=cost_difference,
                cost_percentage=cost_percentage,
                badge_color=badge_color,
                analysis=analysis,
                is_winner=(quote.vendorName == cheapest_vendor)
            ))
        
        return recommendations
    
    def _analyze_vendor_strengths(self, quote: VendorQuote, cheapest_cost: float) -> Dict[str, Any]:
        """Analyze vendor strengths and weaknesses"""
        total_cost = sum(item.total for item in quote.items)
        
        strengths = []
        weaknesses = []
        
        # Analyze pricing
        if total_cost == cheapest_cost:
            strengths.append("Lowest total cost")
        elif total_cost <= cheapest_cost * 1.1:
            strengths.append("Competitive pricing")
        else:
            weaknesses.append("Higher than average pricing")
        
        # Analyze delivery times
        delivery_times = [item.deliveryTime for item in quote.items if item.deliveryTime]
        if delivery_times:
            avg_delivery = self._parse_delivery_time(delivery_times[0])
            if avg_delivery <= 7:
                strengths.append("Fast delivery")
            elif avg_delivery > 21:
                weaknesses.append("Slow delivery")
        
        # Analyze item variety
        if len(quote.items) > 1:
            strengths.append("Wide product selection")
        
        # Analyze terms
        if quote.terms.payment and "net 30" in quote.terms.payment.lower():
            strengths.append("Good payment terms")
        
        if quote.terms.warranty and "warranty" in quote.terms.warranty.lower():
            strengths.append("Warranty included")
        
        return {
            "strengths": strengths,
            "weaknesses": weaknesses,
            "total_items": len(quote.items),
            "avg_unit_price": total_cost / sum(item.quantity for item in quote.items) if quote.items else 0
        }
    
    def _parse_delivery_time(self, delivery_time: str) -> int:
        """Parse delivery time string to days"""
        try:
            if "day" in delivery_time.lower():
                numbers = [int(s) for s in delivery_time.split() if s.isdigit()]
                if numbers:
                    return numbers[0]
            return 14  # Default to 2 weeks
        except:
            return 14
    
    def _create_comparison_matrix(self, quotes: List[VendorQuote], recommendations: List[VendorRecommendation]) -> Dict[str, Any]:
        """Create a detailed comparison matrix"""
        matrix = {
            "vendors": [],
            "summary": {
                "total_vendors": len(quotes),
                "total_cost": sum(rec.total_cost for rec in recommendations),
                "potential_savings": sum(rec.cost_difference for rec in recommendations if rec.cost_difference > 0),
                "winner": next((rec for rec in recommendations if rec.is_winner), None)
            }
        }
        
        for quote, rec in zip(quotes, recommendations):
            vendor_data = {
                "name": quote.vendorName,
                "total_cost": rec.total_cost,
                "recommendation": rec.recommendation_type,
                "badge_color": rec.badge_color,
                "is_winner": rec.is_winner,
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
                "analysis": rec.analysis
            }
            matrix["vendors"].append(vendor_data)
        
        return matrix
    
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
        cheapest_quote = min(quotes, key=lambda q: sum(item.total for item in q.items) if q.items else float('inf'))
        total_cost = sum(item.total for item in cheapest_quote.items) if cheapest_quote.items else 0.0
        
        recommendation = VendorRecommendation(
            vendor_name=cheapest_quote.vendorName,
            recommendation_type="WINNER",
            recommendation_reason="Lowest total cost among available quotes",
            total_cost=total_cost,
            cost_difference=0.0,
            cost_percentage=0.0,
            badge_color="green",
            analysis={"strengths": ["Lowest cost"], "weaknesses": []},
            is_winner=True,
            items_to_purchase=[item.sku for item in cheapest_quote.items],
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