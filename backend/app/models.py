from pydantic import BaseModel
from typing import List, Dict, Any

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

class AnalysisResult(BaseModel):
    quotes: List[VendorQuote]
    comparison: Dict[str, Any]
    recommendation: str 