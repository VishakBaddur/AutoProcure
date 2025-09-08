from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class QuoteItem(BaseModel):
    sku: str
    description: str
    quantity: int
    unitPrice: float
    deliveryTime: str
    total: float

class QuoteTerms(BaseModel):
    payment: str
    warranty: str

class MathCorrection(BaseModel):
    item: str
    original_total: float
    corrected_total: float
    error_percentage: float

class VendorQuote(BaseModel):
    vendorName: str
    items: List[QuoteItem]
    terms: QuoteTerms
    reliability_score: Optional[float] = None  # Vendor reliability rating
    delivery_rating: Optional[str] = None  # Excellent/Good/Fair/Poor
    quality_rating: Optional[str] = None  # Based on past performance
    major_corrections: Optional[List[MathCorrection]] = None  # Major math corrections made

class VendorRecommendation(BaseModel):
    vendor_name: str
    recommendation_type: str  # WINNER, GOOD, ACCEPTABLE, EXPENSIVE
    recommendation_reason: str
    total_cost: float
    cost_difference: float
    cost_percentage: float
    badge_color: str  # green, blue, yellow, red
    analysis: Dict[str, Any]  # strengths, weaknesses, etc.
    is_winner: bool
    items_to_purchase: Optional[List[str]] = None  # SKUs to buy from this vendor
    delivery_time: Optional[str] = None
    reasoning: Optional[str] = None
    reliability_score: Optional[float] = None

class MultiVendorAnalysis(BaseModel):
    quotes: List[VendorQuote]
    comparison: Dict[str, Any]
    recommendation: str
    vendor_recommendations: List[VendorRecommendation]  # Optimal vendor selection
    cost_savings: float  # Potential savings vs single vendor
    risk_assessment: str  # Risk analysis of multi-vendor approach

class AnalysisResult(BaseModel):
    quotes: List[VendorQuote]
    comparison: Dict[str, Any]
    recommendation: str
    multi_vendor_analysis: Optional[MultiVendorAnalysis] = None  # For multi-vendor scenarios 
    advanced_analysis: Optional[Dict[str, Any]] = None  # New field for advanced analysis features 