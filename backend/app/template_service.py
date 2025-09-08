"""
Template Service for AutoProcure
Handles organization template definition and vendor quote mapping
"""

from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

class TemplateField(BaseModel):
    """Individual field in organization template"""
    field_name: str
    field_type: str  # "text", "number", "currency", "date", "dropdown", "textarea"
    required: bool = True
    description: str = ""
    validation_rules: Optional[Dict[str, Any]] = None
    mapping_hints: List[str] = []  # Keywords to help AI map vendor data to this field

class OrganizationTemplate(BaseModel):
    """Organization's standard quote template"""
    template_id: str
    organization_name: str
    template_name: str
    description: str
    created_at: datetime
    updated_at: datetime
    
    # Template structure
    header_fields: List[TemplateField] = []
    item_fields: List[TemplateField] = []
    terms_fields: List[TemplateField] = []
    
    # Additional requirements
    required_documents: List[str] = []  # e.g., ["certificate", "insurance", "warranty"]
    compliance_requirements: List[str] = []  # e.g., ["ISO9001", "security_clearance"]
    
    # Template metadata
    version: str = "1.0"
    is_active: bool = True

class TemplateMappingResult(BaseModel):
    """Result of mapping vendor quote to organization template"""
    vendor_name: str
    template_compliance_score: float  # 0-100
    mapped_fields: Dict[str, Any]
    unmapped_fields: List[str]
    confidence_scores: Dict[str, float]  # Confidence for each mapped field
    mapping_notes: List[str]
    requires_manual_review: bool = False

class TemplateService:
    """Service for managing organization templates and vendor quote mapping"""
    
    def __init__(self):
        self.default_template = self._create_default_template()
    
    def _create_default_template(self) -> OrganizationTemplate:
        """Create a standard procurement template for demo purposes"""
        return OrganizationTemplate(
            template_id="standard_procurement_v1",
            organization_name="AutoProcure Demo Organization",
            template_name="Standard Procurement Quote Template",
            description="Standard template for procurement quotes including items, pricing, and terms",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            
            header_fields=[
                TemplateField(
                    field_name="vendor_company",
                    field_type="text",
                    required=True,
                    description="Vendor company name",
                    mapping_hints=["company", "vendor", "supplier", "business name"]
                ),
                TemplateField(
                    field_name="contact_person",
                    field_type="text",
                    required=True,
                    description="Primary contact person",
                    mapping_hints=["contact", "person", "representative", "sales"]
                ),
                TemplateField(
                    field_name="contact_email",
                    field_type="text",
                    required=True,
                    description="Contact email address",
                    mapping_hints=["email", "contact", "mail"]
                ),
                TemplateField(
                    field_name="contact_phone",
                    field_type="text",
                    required=False,
                    description="Contact phone number",
                    mapping_hints=["phone", "telephone", "mobile", "contact"]
                ),
                TemplateField(
                    field_name="quote_date",
                    field_type="date",
                    required=True,
                    description="Date of quote submission",
                    mapping_hints=["date", "quote date", "submission date", "issued"]
                ),
                TemplateField(
                    field_name="quote_validity",
                    field_type="text",
                    required=True,
                    description="Quote validity period",
                    mapping_hints=["validity", "valid", "expires", "expiry"]
                )
            ],
            
            item_fields=[
                TemplateField(
                    field_name="item_code",
                    field_type="text",
                    required=True,
                    description="Item/SKU code",
                    mapping_hints=["sku", "code", "item code", "part number", "product code"]
                ),
                TemplateField(
                    field_name="item_description",
                    field_type="textarea",
                    required=True,
                    description="Detailed item description",
                    mapping_hints=["description", "item", "product", "specification"]
                ),
                TemplateField(
                    field_name="quantity",
                    field_type="number",
                    required=True,
                    description="Quantity requested",
                    mapping_hints=["quantity", "qty", "amount", "count", "units"]
                ),
                TemplateField(
                    field_name="unit_price",
                    field_type="currency",
                    required=True,
                    description="Price per unit",
                    mapping_hints=["unit price", "price", "cost", "rate", "per unit"]
                ),
                TemplateField(
                    field_name="total_price",
                    field_type="currency",
                    required=True,
                    description="Total price for this item",
                    mapping_hints=["total", "subtotal", "line total", "amount"]
                ),
                TemplateField(
                    field_name="delivery_time",
                    field_type="text",
                    required=True,
                    description="Delivery time for this item",
                    mapping_hints=["delivery", "lead time", "shipping", "timeframe"]
                ),
                TemplateField(
                    field_name="specifications",
                    field_type="textarea",
                    required=False,
                    description="Technical specifications",
                    mapping_hints=["specs", "specifications", "technical", "details"]
                )
            ],
            
            terms_fields=[
                TemplateField(
                    field_name="payment_terms",
                    field_type="text",
                    required=True,
                    description="Payment terms and conditions",
                    mapping_hints=["payment", "terms", "conditions", "net", "days"]
                ),
                TemplateField(
                    field_name="delivery_terms",
                    field_type="text",
                    required=True,
                    description="Delivery terms (FOB, CIF, etc.)",
                    mapping_hints=["delivery", "shipping", "fob", "cif", "terms"]
                ),
                TemplateField(
                    field_name="warranty",
                    field_type="text",
                    required=True,
                    description="Warranty period and terms",
                    mapping_hints=["warranty", "guarantee", "support", "service"]
                ),
                TemplateField(
                    field_name="total_amount",
                    field_type="currency",
                    required=True,
                    description="Total quote amount",
                    mapping_hints=["total", "grand total", "final amount", "sum"]
                ),
                TemplateField(
                    field_name="currency",
                    field_type="text",
                    required=True,
                    description="Currency of the quote",
                    mapping_hints=["currency", "usd", "eur", "gbp", "inr"]
                )
            ],
            
            required_documents=[
                "Company registration certificate",
                "Tax compliance certificate",
                "Quality certifications (if applicable)",
                "Insurance certificate"
            ],
            
            compliance_requirements=[
                "Valid business license",
                "Tax registration",
                "Quality management system (preferred)"
            ]
        )
    
    def get_organization_template(self, template_id: str = None) -> OrganizationTemplate:
        """Get organization template (default for demo)"""
        if template_id is None:
            return self.default_template
        
        # In a real system, this would fetch from database
        # For now, return default template
        return self.default_template
    
    def map_vendor_quote_to_template(
        self, 
        vendor_quote_data: Dict[str, Any], 
        template: OrganizationTemplate
    ) -> TemplateMappingResult:
        """
        Map vendor quote data to organization template using AI
        This is where the magic happens - AI understands vendor format and maps to org template
        """
        try:
            # Extract vendor name
            vendor_name = vendor_quote_data.get("vendorName", "Unknown Vendor")
            
            # Initialize mapping result
            mapped_fields = {}
            unmapped_fields = []
            confidence_scores = {}
            mapping_notes = []
            
            # Map header fields
            header_mapping = self._map_header_fields(vendor_quote_data, template.header_fields)
            mapped_fields.update(header_mapping["mapped"])
            unmapped_fields.extend(header_mapping["unmapped"])
            confidence_scores.update(header_mapping["confidence"])
            mapping_notes.extend(header_mapping["notes"])
            
            # Map item fields
            items_mapping = self._map_items_fields(vendor_quote_data, template.item_fields)
            mapped_fields["items"] = items_mapping["mapped_items"]
            unmapped_fields.extend(items_mapping["unmapped"])
            confidence_scores.update(items_mapping["confidence"])
            mapping_notes.extend(items_mapping["notes"])
            
            # Map terms fields
            terms_mapping = self._map_terms_fields(vendor_quote_data, template.terms_fields)
            mapped_fields.update(terms_mapping["mapped"])
            unmapped_fields.extend(terms_mapping["unmapped"])
            confidence_scores.update(terms_mapping["confidence"])
            mapping_notes.extend(terms_mapping["notes"])
            
            # Calculate overall compliance score
            total_fields = len(template.header_fields) + len(template.item_fields) + len(template.terms_fields)
            mapped_count = len([f for f in mapped_fields.keys() if f != "items"]) + len(mapped_fields.get("items", []))
            template_compliance_score = (mapped_count / total_fields) * 100 if total_fields > 0 else 0
            
            # Determine if manual review is needed
            requires_manual_review = (
                template_compliance_score < 70 or 
                len(unmapped_fields) > 3 or
                any(score < 0.6 for score in confidence_scores.values())
            )
            
            return TemplateMappingResult(
                vendor_name=vendor_name,
                template_compliance_score=template_compliance_score,
                mapped_fields=mapped_fields,
                unmapped_fields=unmapped_fields,
                confidence_scores=confidence_scores,
                mapping_notes=mapping_notes,
                requires_manual_review=requires_manual_review
            )
            
        except Exception as e:
            logger.error(f"Error mapping vendor quote to template: {str(e)}")
            return TemplateMappingResult(
                vendor_name=vendor_quote_data.get("vendorName", "Unknown"),
                template_compliance_score=0,
                mapped_fields={},
                unmapped_fields=["mapping_failed"],
                confidence_scores={},
                mapping_notes=[f"Mapping failed: {str(e)}"],
                requires_manual_review=True
            )
    
    def _map_header_fields(
        self, 
        vendor_data: Dict[str, Any], 
        header_fields: List[TemplateField]
    ) -> Dict[str, Any]:
        """Map vendor data to header fields using AI-like logic"""
        mapped = {}
        unmapped = []
        confidence = {}
        notes = []
        
        # Simple keyword-based mapping for demo
        vendor_text = json.dumps(vendor_data).lower()
        
        for field in header_fields:
            field_mapped = False
            field_confidence = 0.0
            
            # Try to find field in vendor data
            for hint in field.mapping_hints:
                if hint.lower() in vendor_text:
                    # Extract value based on field type
                    value = self._extract_field_value(vendor_data, hint, field.field_type)
                    if value:
                        mapped[field.field_name] = value
                        field_confidence = 0.8  # High confidence for keyword match
                        field_mapped = True
                        notes.append(f"Mapped {field.field_name} using keyword '{hint}'")
                        break
            
            if not field_mapped:
                unmapped.append(field.field_name)
                confidence[field.field_name] = 0.0
            else:
                confidence[field.field_name] = field_confidence
        
        return {
            "mapped": mapped,
            "unmapped": unmapped,
            "confidence": confidence,
            "notes": notes
        }
    
    def _map_items_fields(
        self, 
        vendor_data: Dict[str, Any], 
        item_fields: List[TemplateField]
    ) -> Dict[str, Any]:
        """Map vendor items to template item fields"""
        mapped_items = []
        unmapped = []
        confidence = {}
        notes = []
        
        # Get items from vendor data
        items = vendor_data.get("items", [])
        
        for item in items:
            mapped_item = {}
            item_confidence = {}
            
            for field in item_fields:
                field_mapped = False
                field_confidence = 0.0
                
                # Map based on field hints
                for hint in field.mapping_hints:
                    if hint.lower() in str(item).lower():
                        value = self._extract_item_field_value(item, hint, field.field_type)
                        if value:
                            mapped_item[field.field_name] = value
                            field_confidence = 0.8
                            field_mapped = True
                            break
                
                if not field_mapped:
                    unmapped.append(f"{field.field_name} (item)")
                    item_confidence[field.field_name] = 0.0
                else:
                    item_confidence[field.field_name] = field_confidence
            
            mapped_items.append(mapped_item)
            confidence.update(item_confidence)
        
        return {
            "mapped_items": mapped_items,
            "unmapped": unmapped,
            "confidence": confidence,
            "notes": notes
        }
    
    def _map_terms_fields(
        self, 
        vendor_data: Dict[str, Any], 
        terms_fields: List[TemplateField]
    ) -> Dict[str, Any]:
        """Map vendor terms to template terms fields"""
        mapped = {}
        unmapped = []
        confidence = {}
        notes = []
        
        # Get terms from vendor data
        terms = vendor_data.get("terms", {})
        vendor_text = json.dumps(vendor_data).lower()
        
        for field in terms_fields:
            field_mapped = False
            field_confidence = 0.0
            
            # Try to find in terms object first
            for hint in field.mapping_hints:
                if hint.lower() in str(terms).lower():
                    value = self._extract_field_value(terms, hint, field.field_type)
                    if value:
                        mapped[field.field_name] = value
                        field_confidence = 0.9
                        field_mapped = True
                        notes.append(f"Mapped {field.field_name} from terms using '{hint}'")
                        break
            
            # If not found in terms, try general vendor data
            if not field_mapped:
                for hint in field.mapping_hints:
                    if hint.lower() in vendor_text:
                        value = self._extract_field_value(vendor_data, hint, field.field_type)
                        if value:
                            mapped[field.field_name] = value
                            field_confidence = 0.7
                            field_mapped = True
                            notes.append(f"Mapped {field.field_name} from general data using '{hint}'")
                            break
            
            if not field_mapped:
                unmapped.append(field.field_name)
                confidence[field.field_name] = 0.0
            else:
                confidence[field.field_name] = field_confidence
        
        return {
            "mapped": mapped,
            "unmapped": unmapped,
            "confidence": confidence,
            "notes": notes
        }
    
    def _extract_field_value(self, data: Dict[str, Any], hint: str, field_type: str) -> Any:
        """Extract field value based on hint and type"""
        # Simple extraction logic for demo
        hint_lower = hint.lower()
        
        for key, value in data.items():
            if hint_lower in key.lower():
                return self._convert_value_type(value, field_type)
        
        return None
    
    def _extract_item_field_value(self, item: Dict[str, Any], hint: str, field_type: str) -> Any:
        """Extract field value from item data"""
        hint_lower = hint.lower()
        
        for key, value in item.items():
            if hint_lower in key.lower():
                return self._convert_value_type(value, field_type)
        
        return None
    
    def _convert_value_type(self, value: Any, field_type: str) -> Any:
        """Convert value to appropriate type"""
        if value is None:
            return None
        
        try:
            if field_type == "number":
                return float(value) if value else 0.0
            elif field_type == "currency":
                # Remove currency symbols and convert to float
                if isinstance(value, str):
                    cleaned = value.replace("$", "").replace(",", "").replace("USD", "").strip()
                    return float(cleaned) if cleaned else 0.0
                return float(value) if value else 0.0
            elif field_type == "date":
                return str(value)  # Keep as string for now
            else:
                return str(value)
        except (ValueError, TypeError):
            return str(value) if value else None

# Global template service instance
template_service = TemplateService()
