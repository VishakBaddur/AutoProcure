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

class VendorQuote(BaseModel):
    vendorName: str
    items: List[QuoteItem]
    terms: QuoteTerms
    reliability_score: Optional[float] = None  # Vendor reliability rating
    delivery_rating: Optional[str] = None  # Excellent/Good/Fair/Poor
    quality_rating: Optional[str] = None  # Based on past performance

class VendorRecommendation(BaseModel):
    vendor_name: str
    items_to_purchase: List[str]  # SKUs to buy from this vendor
    total_cost: float
    delivery_time: str
    reasoning: str
    reliability_score: float

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