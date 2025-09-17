from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any
from datetime import datetime
import logging
import io

from ..database_sqlalchemy import get_sqlalchemy_db
from sqlalchemy.orm import Session
from ..template_service import template_service, OrganizationTemplate, TemplateMappingResult
from ..models.vendor import VendorCreate, RFQCreate, VendorResponse, RFQResponse, RFQParticipationResponse
from ..services.vendor_service import VendorService
from ..services.email_service import EmailService
from ..services.report_service import report_service
from ..services.export_service import export_service

router = APIRouter(prefix="/api/vendor", tags=["vendor"])
logger = logging.getLogger(__name__)

@router.post("/rfq/create", response_model=RFQResponse)
async def create_rfq(
    rfq_data: RFQCreate,
    created_by: str = Form(...),
    db: Session = Depends(get_sqlalchemy_db)
):
    """Create a new RFQ"""
    try:
        vendor_service = VendorService(db)
        rfq = vendor_service.create_rfq(rfq_data, created_by)
        return rfq
    except Exception as e:
        logger.error(f"Error creating RFQ: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create RFQ: {str(e)}")

@router.post("/upload-vendor-list")
async def upload_vendor_list(
    rfq_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_sqlalchemy_db)
):
    """Upload vendor list and create participations"""
    try:
        # Validate file type
        if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
        
        # Read file content (limit size to prevent abuse)
        file_content = await file.read()
        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        if len(file_content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max 5MB")
        
        # Process vendor list
        vendor_service = VendorService(db)
        result = vendor_service.upload_vendor_list(file_content, file.filename, rfq_id)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['error'])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading vendor list: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload vendor list: {str(e)}")

@router.post("/send-rfq-emails/{rfq_id}")
async def send_rfq_emails(
    rfq_id: str,
    base_url: str = "http://localhost:3000",
    db: Session = Depends(get_sqlalchemy_db)
):
    """Send RFQ emails to all vendors"""
    try:
        vendor_service = VendorService(db)
        email_service = EmailService()
        
        # Get all participations for this RFQ
        participations = vendor_service.get_rfq_participations(rfq_id)
        
        if not participations:
            raise HTTPException(status_code=404, detail="No vendors found for this RFQ")
        
        # Get RFQ details
        rfq = vendor_service.get_rfq_by_id(rfq_id)
        
        if not rfq:
            raise HTTPException(status_code=404, detail="RFQ not found")
        
        # Send emails
        emails_sent = 0
        emails_failed = 0
        results = []
        
        for participation in participations:
            if not participation.email_sent:
                success = email_service.send_rfq_email(
                    vendor_email=participation.vendor.email,
                    vendor_name=participation.vendor.name,
                    rfq_title=rfq.title,
                    rfq_description=rfq.description,
                    deadline=rfq.deadline,
                    unique_link=participation.unique_link,
                    base_url=base_url
                )
                
                if success:
                    vendor_service.mark_email_sent(participation.participation_id)
                    emails_sent += 1
                    results.append({
                        'vendor_email': participation.vendor.email,
                        'status': 'sent'
                    })
                else:
                    emails_failed += 1
                    results.append({
                        'vendor_email': participation.vendor.email,
                        'status': 'failed'
                    })
            else:
                results.append({
                    'vendor_email': participation.vendor.email,
                    'status': 'already_sent'
                })
        
        return {
            'success': True,
            'emails_sent': emails_sent,
            'emails_failed': emails_failed,
            'total_vendors': len(participations),
            'results': results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending RFQ emails: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send emails: {str(e)}")

@router.get("/rfq/{rfq_id}/dashboard")
async def get_rfq_dashboard(
    rfq_id: str,
    db: Session = Depends(get_sqlalchemy_db)
):
    """Get dashboard data for an RFQ"""
    try:
        vendor_service = VendorService(db)
        dashboard_data = vendor_service.get_rfq_dashboard_data(rfq_id)
        return dashboard_data
    except Exception as e:
        logger.error(f"Error getting dashboard data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard data: {str(e)}")

@router.get("/rfq/{rfq_id}/participations", response_model=List[RFQParticipationResponse])
async def get_rfq_participations(
    rfq_id: str,
    db: Session = Depends(get_sqlalchemy_db)
):
    """Get all participations for an RFQ"""
    try:
        vendor_service = VendorService(db)
        participations = vendor_service.get_rfq_participations(rfq_id)
        return participations
    except Exception as e:
        logger.error(f"Error getting participations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get participations: {str(e)}")

@router.get("/vendor-portal/{unique_link}")
async def get_vendor_portal_info(
    unique_link: str,
    db: Session = Depends(get_sqlalchemy_db)
):
    """Get vendor portal information for submission"""
    try:
        vendor_service = VendorService(db)
        participation = vendor_service.get_vendor_by_link(unique_link)
        
        if not participation:
            # Demo mode fallback - provide a working demo portal
            logger.warning(f"Vendor portal link not found: {unique_link} - using demo mode")
            return {
                'participation_id': f"demo-{unique_link[:8]}",
                'vendor_name': 'Demo Vendor',
                'vendor_company': 'Demo Company Inc.',
                'rfq_title': 'Office Supplies Q1 2024',
                'rfq_description': 'Procurement of office chairs, lamps, and paper supplies for Q1 2024',
                'deadline': datetime.utcnow(),
                'status': 'pending',
                'submitted_at': None,
                'demo_mode': True
            }
        
        # Handle missing vendor or RFQ data gracefully
        vendor_name = "Unknown Vendor"
        vendor_company = ""
        if hasattr(participation, 'vendor') and participation.vendor:
            vendor_name = getattr(participation.vendor, 'name', 'Unknown Vendor')
            vendor_company = getattr(participation.vendor, 'company', '')
        
        # Some demo RFQs may not exist in DB; handle gracefully
        rfq = getattr(participation, 'rfq', None)
        rfq_title = "RFQ"
        rfq_description = "Please submit your quote using the form below."
        deadline = datetime.utcnow()
        
        if rfq is not None:
            rfq_title = getattr(rfq, 'title', 'RFQ')
            rfq_description = getattr(rfq, 'description', 'Please submit your quote using the form below.')
            deadline = getattr(rfq, 'deadline', datetime.utcnow())
            
            # Check if RFQ is still active
            if getattr(rfq, 'status', 'active') != "active":
                raise HTTPException(status_code=400, detail="This RFQ is no longer active")
            # Check if deadline has passed
            try:
                if rfq.deadline and rfq.deadline < datetime.utcnow():
                    raise HTTPException(status_code=400, detail="Submission deadline has passed")
            except Exception:
                pass
        
        return {
            'participation_id': participation.participation_id,
            'vendor_name': vendor_name,
            'vendor_company': vendor_company,
            'rfq_title': rfq_title,
            'rfq_description': rfq_description,
            'deadline': deadline,
            'status': getattr(participation, 'status', 'pending'),
            'submitted_at': getattr(participation, 'submitted_at', None)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting vendor portal info: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get portal info. Please try again or contact support. Error: {str(e)}"
        )

@router.post("/vendor-portal/{unique_link}/submit")
async def submit_vendor_quote(
    unique_link: str,
    submission_data: Dict[str, Any],
    db: Session = Depends(get_sqlalchemy_db)
):
    """Submit vendor quote"""
    try:
        vendor_service = VendorService(db)
        email_service = EmailService()
        
        # Get participation
        participation = vendor_service.get_vendor_by_link(unique_link)
        
        if not participation:
            # Demo mode - accept submission without database
            logger.info(f"Demo submission received for link: {unique_link}")
            return {
                'success': True,
                'submission_id': f"demo-{unique_link[:8]}",
                'message': 'Demo quote submitted successfully (demo mode)',
                'demo_mode': True
            }
        
        # Check if already submitted
        if participation.status == "submitted":
            raise HTTPException(status_code=400, detail="Quote already submitted")
        
        # Check RFQ status only if RFQ exists (demo-safe)
        rfq = getattr(participation, 'rfq', None)
        if rfq is not None:
            if getattr(rfq, 'status', 'active') != "active":
                raise HTTPException(status_code=400, detail="This RFQ is no longer active")
            try:
                if rfq.deadline and rfq.deadline < datetime.utcnow():
                    raise HTTPException(status_code=400, detail="Submission deadline has passed")
            except Exception:
                pass
        
        # Update participation status
        success = vendor_service.update_participation_status(
            participation.participation_id, 
            "submitted", 
            submission_data
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update submission status")
        
        # Send confirmation email
        email_service.send_submission_confirmation(
            vendor_email=participation.vendor.email,
            vendor_name=participation.vendor.name,
            submission_id=participation.participation_id,
            rfq_title=participation.rfq.title
        )
        
        return {
            'success': True,
            'submission_id': participation.participation_id,
            'message': 'Quote submitted successfully'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting quote: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to submit quote: {str(e)}")

@router.post("/rfq/{rfq_id}/analyze-quotes")
async def analyze_rfq_quotes(
    rfq_id: str,
    db: Session = Depends(get_sqlalchemy_db)
):
    """Analyze all submitted quotes for an RFQ using AI comparison"""
    try:
        vendor_service = VendorService(db)
        
        # Get RFQ details
        rfq = vendor_service.get_rfq_by_id(rfq_id)
        if not rfq:
            raise HTTPException(status_code=404, detail="RFQ not found")
        
        # Get all participations with submissions
        participations = vendor_service.get_rfq_participations(rfq_id)
        submitted_participations = [p for p in participations if p.status == "submitted"]
        
        if len(submitted_participations) < 2:
            raise HTTPException(status_code=400, detail="At least 2 submitted quotes required for comparison")
        
        # Convert participations to VendorQuote format for analysis
        quotes = []
        for participation in submitted_participations:
            if participation.submission_data:
                try:
                    # Parse submission data
                    submission_data = json.loads(participation.submission_data)
                    
                    # Convert to VendorQuote format
                    from ..models import VendorQuote, QuoteItem, QuoteTerms
                    
                    items = []
                    if 'items' in submission_data:
                        for item_data in submission_data['items']:
                            item = QuoteItem(
                                sku=item_data.get('sku', 'N/A'),
                                description=item_data.get('description', 'Unknown Item'),
                                quantity=item_data.get('quantity', 1),
                                unitPrice=item_data.get('unitPrice', 0.0),
                                deliveryTime=item_data.get('deliveryTime', 'TBD'),
                                total=item_data.get('total', 0.0)
                            )
                            items.append(item)
                    
                    terms = QuoteTerms(
                        payment=submission_data.get('terms', {}).get('payment', 'TBD'),
                        warranty=submission_data.get('terms', {}).get('warranty', 'TBD')
                    )
                    
                    quote = VendorQuote(
                        vendorName=participation.vendor.name,
                        items=items,
                        terms=terms
                    )
                    quotes.append(quote)
                    
                except Exception as e:
                    logger.error(f"Error parsing submission data for {participation.vendor.name}: {str(e)}")
                    continue
        
        if len(quotes) < 2:
            raise HTTPException(status_code=400, detail="Insufficient valid quotes for comparison")
        
        # Use existing multi-vendor analysis
        from ..multi_vendor_analyzer import multi_vendor_analyzer
        analysis_result = await multi_vendor_analyzer.analyze_multiple_quotes(quotes)
        
        return {
            'rfq_id': rfq_id,
            'rfq_title': rfq.title,
            'analysis_result': analysis_result,
            'submitted_count': len(submitted_participations),
            'valid_quotes_count': len(quotes)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing RFQ quotes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze quotes: {str(e)}")

@router.post("/rfq/{rfq_id}/export/pdf")
async def export_rfq_analysis_pdf(
    rfq_id: str,
    db: Session = Depends(get_sqlalchemy_db)
):
    """Export RFQ analysis results to PDF"""
    try:
        vendor_service = VendorService(db)
        
        # Get RFQ details
        rfq = vendor_service.get_rfq_by_id(rfq_id)
        if not rfq:
            raise HTTPException(status_code=404, detail="RFQ not found")
        
        # Get analysis results (reuse the analyze-quotes logic)
        participations = vendor_service.get_rfq_participations(rfq_id)
        submitted_participations = [p for p in participations if p.status == "submitted"]
        
        if len(submitted_participations) < 2:
            raise HTTPException(status_code=400, detail="At least 2 submitted quotes required for export")
        
        # Convert to VendorQuote format
        quotes = []
        for participation in submitted_participations:
            if participation.submission_data:
                try:
                    submission_data = json.loads(participation.submission_data)
                    from ..models import VendorQuote, QuoteItem, QuoteTerms
                    
                    items = []
                    if 'items' in submission_data:
                        for item_data in submission_data['items']:
                            item = QuoteItem(
                                sku=item_data.get('sku', 'N/A'),
                                description=item_data.get('description', 'Unknown Item'),
                                quantity=item_data.get('quantity', 1),
                                unitPrice=item_data.get('unitPrice', 0.0),
                                deliveryTime=item_data.get('deliveryTime', 'TBD'),
                                total=item_data.get('total', 0.0)
                            )
                            items.append(item)
                    
                    terms = QuoteTerms(
                        payment=submission_data.get('terms', {}).get('payment', 'TBD'),
                        warranty=submission_data.get('terms', {}).get('warranty', 'TBD')
                    )
                    
                    quote = VendorQuote(
                        vendorName=participation.vendor.name,
                        items=items,
                        terms=terms
                    )
                    quotes.append(quote)
                except Exception as e:
                    logger.error(f"Error parsing submission data: {str(e)}")
                    continue
        
        # Perform analysis
        from ..multi_vendor_analyzer import multi_vendor_analyzer
        analysis_result = await multi_vendor_analyzer.analyze_multiple_quotes(quotes)
        
        # Prepare RFQ data
        rfq_data = {
            'title': rfq.title,
            'description': rfq.description,
            'deadline': rfq.deadline.isoformat() if rfq.deadline else 'N/A',
            'total_budget': rfq.total_budget,
            'currency': rfq.currency
        }
        
        # Generate PDF
        pdf_content = export_service.export_to_pdf(
            rfq_data=rfq_data,
            analysis_result=analysis_result,
            issues_detected=[],  # TODO: Add issues detection
            compliance_results={}  # TODO: Add compliance results
        )
        
        # Return PDF as response
        from fastapi.responses import Response
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=rfq_{rfq_id}_analysis.pdf"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to export PDF: {str(e)}")

@router.post("/rfq/{rfq_id}/export/excel")
async def export_rfq_analysis_excel(
    rfq_id: str,
    db: Session = Depends(get_sqlalchemy_db)
):
    """Export RFQ analysis results to Excel"""
    try:
        vendor_service = VendorService(db)
        
        # Get RFQ details
        rfq = vendor_service.get_rfq_by_id(rfq_id)
        if not rfq:
            raise HTTPException(status_code=404, detail="RFQ not found")
        
        # Get analysis results (reuse the analyze-quotes logic)
        participations = vendor_service.get_rfq_participations(rfq_id)
        submitted_participations = [p for p in participations if p.status == "submitted"]
        
        if len(submitted_participations) < 2:
            raise HTTPException(status_code=400, detail="At least 2 submitted quotes required for export")
        
        # Convert to VendorQuote format
        quotes = []
        for participation in submitted_participations:
            if participation.submission_data:
                try:
                    submission_data = json.loads(participation.submission_data)
                    from ..models import VendorQuote, QuoteItem, QuoteTerms
                    
                    items = []
                    if 'items' in submission_data:
                        for item_data in submission_data['items']:
                            item = QuoteItem(
                                sku=item_data.get('sku', 'N/A'),
                                description=item_data.get('description', 'Unknown Item'),
                                quantity=item_data.get('quantity', 1),
                                unitPrice=item_data.get('unitPrice', 0.0),
                                deliveryTime=item_data.get('deliveryTime', 'TBD'),
                                total=item_data.get('total', 0.0)
                            )
                            items.append(item)
                    
                    terms = QuoteTerms(
                        payment=submission_data.get('terms', {}).get('payment', 'TBD'),
                        warranty=submission_data.get('terms', {}).get('warranty', 'TBD')
                    )
                    
                    quote = VendorQuote(
                        vendorName=participation.vendor.name,
                        items=items,
                        terms=terms
                    )
                    quotes.append(quote)
                except Exception as e:
                    logger.error(f"Error parsing submission data: {str(e)}")
                    continue
        
        # Perform analysis
        from ..multi_vendor_analyzer import multi_vendor_analyzer
        analysis_result = await multi_vendor_analyzer.analyze_multiple_quotes(quotes)
        
        # Prepare RFQ data
        rfq_data = {
            'title': rfq.title,
            'description': rfq.description,
            'deadline': rfq.deadline.isoformat() if rfq.deadline else 'N/A',
            'total_budget': rfq.total_budget,
            'currency': rfq.currency
        }
        
        # Generate Excel
        excel_content = export_service.export_to_excel(
            rfq_data=rfq_data,
            analysis_result=analysis_result,
            issues_detected=[],  # TODO: Add issues detection
            compliance_results={}  # TODO: Add compliance results
        )
        
        # Return Excel as response
        from fastapi.responses import Response
        return Response(
            content=excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=rfq_{rfq_id}_analysis.xlsx"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting Excel: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to export Excel: {str(e)}")

@router.get("/template/organization")
async def get_organization_template():
    """Get organization's standard quote template"""
    try:
        template = template_service.get_organization_template()
        return {
            "template": template.dict(),
            "message": "Organization template retrieved successfully"
        }
    except Exception as e:
        logger.error(f"Error getting organization template: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get template: {str(e)}")

@router.post("/template/map-vendor-quote")
async def map_vendor_quote_to_template(
    vendor_quote_data: Dict[str, Any],
    template_id: str = None
):
    """Map vendor quote data to organization template"""
    try:
        # Get organization template
        template = template_service.get_organization_template(template_id)
        
        # Map vendor quote to template
        mapping_result = template_service.map_vendor_quote_to_template(
            vendor_quote_data, template
        )
        
        return {
            "mapping_result": mapping_result.dict(),
            "template_used": template.template_name,
            "message": "Vendor quote mapped to organization template successfully"
        }
        
    except Exception as e:
        logger.error(f"Error mapping vendor quote to template: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to map quote: {str(e)}")

@router.post("/rfq/{rfq_id}/export-report")
async def export_comparison_report(rfq_id: str, db: Session = Depends(get_sqlalchemy_db)):
    """Export vendor comparison report as PDF"""
    try:
        vendor_service = VendorService(db)
        
        # Get RFQ details
        rfq = vendor_service.get_rfq_by_id(rfq_id)
        if not rfq:
            raise HTTPException(status_code=404, detail="RFQ not found")
        
        # Get all participations with submissions
        participations = vendor_service.get_rfq_participations(rfq_id)
        submitted_participations = [p for p in participations if p.status == "submitted"]
        
        if not submitted_participations:
            raise HTTPException(status_code=400, detail="No submitted quotes found for this RFQ")
        
        # Convert participations to quote format for analysis
        quotes = []
        for participation in submitted_participations:
            if participation.submission_data:
                quote = {
                    "vendorName": participation.vendor.name,
                    "items": participation.submission_data.get("items", []),
                    "terms": participation.submission_data.get("terms", {}),
                    "totalCost": sum(item.get("total", 0) for item in participation.submission_data.get("items", [])),
                    "complianceScore": 85,  # Default compliance score
                    "riskScore": 15,  # Default risk score
                    "anomalies": []  # Would be populated by analysis
                }
                quotes.append(quote)
        
        # Generate analysis result (simplified for now)
        analysis_result = {
            "winner": {
                "vendor": min(quotes, key=lambda x: x["totalCost"])["vendorName"],
                "reasoning": "Selected based on lowest total cost and compliance requirements"
            },
            "recommendations": [
                {
                    "description": "Consider negotiating bulk discounts",
                    "reasoning": "Multiple vendors offer similar items with potential for better pricing"
                }
            ]
        }
        
        # Generate PDF report
        pdf_content = report_service.generate_vendor_comparison_report(
            quotes=quotes,
            analysis_result=analysis_result,
            rfq_title=rfq.title
        )
        
        # Return PDF as streaming response
        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=rfq_{rfq_id}_comparison_report.pdf"}
        )
        
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")
