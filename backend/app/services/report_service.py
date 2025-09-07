import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import io

class ReportService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Setup custom paragraph styles for the report"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=18,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        ))
        
        # Heading style
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.darkblue
        ))
        
        # Subheading style
        self.styles.add(ParagraphStyle(
            name='CustomSubHeading',
            parent=self.styles['Heading3'],
            fontSize=12,
            spaceAfter=8,
            textColor=colors.darkgreen
        ))
        
        # Body text style
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6
        ))
        
        # Highlight style
        self.styles.add(ParagraphStyle(
            name='Highlight',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            textColor=colors.red,
            backColor=colors.lightgrey
        ))

    def generate_vendor_comparison_report(
        self, 
        quotes: List[Dict[str, Any]], 
        analysis_result: Dict[str, Any],
        rfq_title: str = "Vendor Comparison Report"
    ) -> bytes:
        """Generate a comprehensive vendor comparison PDF report"""
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, 
                              topMargin=72, bottomMargin=18)
        
        # Build the story (content)
        story = []
        
        # Title
        story.append(Paragraph(f"<b>{rfq_title}</b>", self.styles['CustomTitle']))
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", 
                              self.styles['CustomBody']))
        story.append(Spacer(1, 20))
        
        # Executive Summary
        story.append(Paragraph("Executive Summary", self.styles['CustomHeading']))
        story.extend(self._create_executive_summary(quotes, analysis_result))
        story.append(Spacer(1, 20))
        
        # Vendor Comparison Table
        story.append(Paragraph("Vendor Comparison", self.styles['CustomHeading']))
        story.extend(self._create_vendor_comparison_table(quotes))
        story.append(Spacer(1, 20))
        
        # Line Item Analysis
        story.append(Paragraph("Line Item Analysis", self.styles['CustomHeading']))
        story.extend(self._create_line_item_analysis(quotes))
        story.append(Spacer(1, 20))
        
        # Risk Assessment
        story.append(Paragraph("Risk Assessment", self.styles['CustomHeading']))
        story.extend(self._create_risk_assessment(quotes))
        story.append(Spacer(1, 20))
        
        # Compliance Status
        story.append(Paragraph("Compliance Status", self.styles['CustomHeading']))
        story.extend(self._create_compliance_status(quotes))
        story.append(Spacer(1, 20))
        
        # AI Recommendations
        story.append(Paragraph("AI Recommendations", self.styles['CustomHeading']))
        story.extend(self._create_ai_recommendations(analysis_result))
        story.append(Spacer(1, 20))
        
        # Final Recommendation
        story.append(Paragraph("Final Recommendation", self.styles['CustomHeading']))
        story.extend(self._create_final_recommendation(quotes, analysis_result))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    def _create_executive_summary(self, quotes: List[Dict], analysis_result: Dict) -> List:
        """Create executive summary section"""
        content = []
        
        # Calculate totals
        total_vendors = len(quotes)
        total_items = sum(len(quote.get('items', [])) for quote in quotes)
        total_value = sum(quote.get('totalCost', 0) for quote in quotes)
        best_vendor = min(quotes, key=lambda x: x.get('totalCost', float('inf')))
        worst_vendor = max(quotes, key=lambda x: x.get('totalCost', 0))
        
        # Summary table
        summary_data = [
            ['Metric', 'Value'],
            ['Total Vendors Evaluated', str(total_vendors)],
            ['Total Items Analyzed', str(total_items)],
            ['Total Procurement Value', f"${total_value:,.2f}"],
            ['Best Value Vendor', best_vendor.get('vendorName', 'N/A')],
            ['Best Value Total', f"${best_vendor.get('totalCost', 0):,.2f}"],
            ['Potential Savings', f"${worst_vendor.get('totalCost', 0) - best_vendor.get('totalCost', 0):,.2f}"],
            ['Savings Percentage', f"{((worst_vendor.get('totalCost', 0) - best_vendor.get('totalCost', 0)) / worst_vendor.get('totalCost', 1) * 100):.1f}%"]
        ]
        
        summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        content.append(summary_table)
        return content

    def _create_vendor_comparison_table(self, quotes: List[Dict]) -> List:
        """Create vendor comparison table"""
        content = []
        
        # Prepare table data
        table_data = [['Vendor', 'Total Cost', 'Items', 'Compliance', 'Risk Score', 'Anomalies']]
        
        for quote in quotes:
            vendor_name = quote.get('vendorName', 'Unknown')
            total_cost = quote.get('totalCost', 0)
            item_count = len(quote.get('items', []))
            compliance = quote.get('complianceScore', 0)
            risk_score = quote.get('riskScore', 0)
            anomalies = len(quote.get('anomalies', []))
            
            table_data.append([
                vendor_name,
                f"${total_cost:,.2f}",
                str(item_count),
                f"{compliance}%",
                f"{risk_score}%",
                str(anomalies)
            ])
        
        # Create table
        vendor_table = Table(table_data, colWidths=[2*inch, 1*inch, 0.8*inch, 0.8*inch, 0.8*inch, 0.8*inch])
        vendor_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 9)
        ]))
        
        content.append(vendor_table)
        return content

    def _create_line_item_analysis(self, quotes: List[Dict]) -> List:
        """Create line item analysis section"""
        content = []
        
        # Get all unique items
        all_items = {}
        for quote in quotes:
            for item in quote.get('items', []):
                item_desc = item.get('description', '')
                if item_desc not in all_items:
                    all_items[item_desc] = []
                all_items[item_desc].append({
                    'vendor': quote.get('vendorName', ''),
                    'price': item.get('unitPrice', 0),
                    'quantity': item.get('quantity', 0),
                    'total': item.get('total', 0)
                })
        
        # Create line item table
        for item_desc, vendors in all_items.items():
            content.append(Paragraph(f"<b>{item_desc}</b>", self.styles['CustomSubHeading']))
            
            item_data = [['Vendor', 'Unit Price', 'Quantity', 'Total']]
            for vendor_data in vendors:
                item_data.append([
                    vendor_data['vendor'],
                    f"${vendor_data['price']:.2f}",
                    str(vendor_data['quantity']),
                    f"${vendor_data['total']:.2f}"
                ])
            
            item_table = Table(item_data, colWidths=[2*inch, 1*inch, 1*inch, 1*inch])
            item_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            content.append(item_table)
            content.append(Spacer(1, 10))
        
        return content

    def _create_risk_assessment(self, quotes: List[Dict]) -> List:
        """Create risk assessment section"""
        content = []
        
        for quote in quotes:
            vendor_name = quote.get('vendorName', 'Unknown')
            risk_score = quote.get('riskScore', 0)
            anomalies = quote.get('anomalies', [])
            
            content.append(Paragraph(f"<b>{vendor_name}</b>", self.styles['CustomSubHeading']))
            content.append(Paragraph(f"Risk Score: {risk_score}%", self.styles['CustomBody']))
            
            if anomalies:
                content.append(Paragraph("Identified Risks:", self.styles['CustomBody']))
                for anomaly in anomalies:
                    content.append(Paragraph(f"• {anomaly}", self.styles['Highlight']))
            else:
                content.append(Paragraph("No significant risks identified.", self.styles['CustomBody']))
            
            content.append(Spacer(1, 10))
        
        return content

    def _create_compliance_status(self, quotes: List[Dict]) -> List:
        """Create compliance status section"""
        content = []
        
        for quote in quotes:
            vendor_name = quote.get('vendorName', 'Unknown')
            compliance_score = quote.get('complianceScore', 0)
            
            content.append(Paragraph(f"<b>{vendor_name}</b>", self.styles['CustomSubHeading']))
            content.append(Paragraph(f"Compliance Score: {compliance_score}%", self.styles['CustomBody']))
            
            if compliance_score >= 80:
                content.append(Paragraph("✓ Fully compliant with procurement requirements", 
                                       self.styles['CustomBody']))
            elif compliance_score >= 60:
                content.append(Paragraph("⚠ Minor compliance issues identified", 
                                       self.styles['Highlight']))
            else:
                content.append(Paragraph("✗ Significant compliance issues", 
                                       self.styles['Highlight']))
            
            content.append(Spacer(1, 10))
        
        return content

    def _create_ai_recommendations(self, analysis_result: Dict) -> List:
        """Create AI recommendations section"""
        content = []
        
        recommendations = analysis_result.get('recommendations', [])
        if not recommendations:
            content.append(Paragraph("No specific recommendations available.", self.styles['CustomBody']))
            return content
        
        for i, rec in enumerate(recommendations, 1):
            content.append(Paragraph(f"<b>Recommendation {i}:</b>", self.styles['CustomSubHeading']))
            content.append(Paragraph(rec.get('description', ''), self.styles['CustomBody']))
            content.append(Paragraph(f"Reasoning: {rec.get('reasoning', '')}", self.styles['CustomBody']))
            content.append(Spacer(1, 8))
        
        return content

    def _create_final_recommendation(self, quotes: List[Dict], analysis_result: Dict) -> List:
        """Create final recommendation section"""
        content = []
        
        # Find best vendor
        best_vendor = min(quotes, key=lambda x: x.get('totalCost', float('inf')))
        worst_vendor = max(quotes, key=lambda x: x.get('totalCost', 0))
        
        savings = worst_vendor.get('totalCost', 0) - best_vendor.get('totalCost', 0)
        savings_percent = (savings / worst_vendor.get('totalCost', 1)) * 100
        
        content.append(Paragraph("RECOMMENDED VENDOR", self.styles['CustomHeading']))
        content.append(Paragraph(f"<b>{best_vendor.get('vendorName', 'Unknown')}</b>", 
                               self.styles['CustomTitle']))
        
        content.append(Paragraph("Justification:", self.styles['CustomSubHeading']))
        content.append(Paragraph(f"• Lowest total cost: ${best_vendor.get('totalCost', 0):,.2f}", 
                               self.styles['CustomBody']))
        content.append(Paragraph(f"• Potential savings: ${savings:,.2f} ({savings_percent:.1f}%)", 
                               self.styles['CustomBody']))
        content.append(Paragraph(f"• Compliance score: {best_vendor.get('complianceScore', 0)}%", 
                               self.styles['CustomBody']))
        content.append(Paragraph(f"• Risk score: {best_vendor.get('riskScore', 0)}%", 
                               self.styles['CustomBody']))
        
        # Add AI reasoning if available
        winner = analysis_result.get('winner', {})
        if winner.get('reasoning'):
            content.append(Paragraph("AI Analysis:", self.styles['CustomSubHeading']))
            content.append(Paragraph(winner.get('reasoning', ''), self.styles['CustomBody']))
        
        return content

# Create global instance
report_service = ReportService()
