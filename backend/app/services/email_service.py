import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
from datetime import datetime
import logging
from ..config import settings

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL
        self.from_name = settings.FROM_NAME
    
    def send_rfq_email(self, vendor_email: str, vendor_name: str, rfq_title: str, 
                      rfq_description: str, deadline: datetime, unique_link: str, 
                      base_url: str = "http://localhost:3000") -> bool:
        """Send RFQ email to vendor"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"RFQ Invitation: {rfq_title}"
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = vendor_email
            
            # Create HTML content
            html_content = self._create_rfq_email_html(
                vendor_name, rfq_title, rfq_description, deadline, unique_link, base_url
            )
            
            # Create plain text content
            text_content = self._create_rfq_email_text(
                vendor_name, rfq_title, rfq_description, deadline, unique_link, base_url
            )
            
            # Attach parts
            part1 = MIMEText(text_content, 'plain')
            part2 = MIMEText(html_content, 'html')
            
            msg.attach(part1)
            msg.attach(part2)
            
            # Send email
            if self.smtp_username and self.smtp_password:
                # Use SMTP authentication
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
                server.quit()
            else:
                # For development - just log the email
                logger.info(f"Email would be sent to {vendor_email}")
                logger.info(f"Subject: {msg['Subject']}")
                logger.info(f"Link: {base_url}/vendor-submit/{unique_link}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {vendor_email}: {str(e)}")
            return False
    
    def _create_rfq_email_html(self, vendor_name: str, rfq_title: str, 
                              rfq_description: str, deadline: datetime, 
                              unique_link: str, base_url: str) -> str:
        """Create HTML email content"""
        deadline_str = deadline.strftime("%B %d, %Y at %I:%M %p")
        submission_url = f"{base_url}/vendor-submit/{unique_link}"
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>RFQ Invitation</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }}
                .button:hover {{ background: #5a6fd8; }}
                .deadline {{ background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏢 AutoProcure</h1>
                    <h2>Request for Quotation (RFQ)</h2>
                </div>
                
                <div class="content">
                    <h3>Dear {vendor_name},</h3>
                    
                    <p>We are pleased to invite you to participate in our Request for Quotation (RFQ) process.</p>
                    
                    <h4>📋 RFQ Details:</h4>
                    <p><strong>Title:</strong> {rfq_title}</p>
                    <p><strong>Description:</strong></p>
                    <p>{rfq_description}</p>
                    
                    <div class="deadline">
                        <h4>⏰ Important Deadline</h4>
                        <p><strong>Submission Deadline:</strong> {deadline_str}</p>
                    </div>
                    
                    <p>To submit your quotation, please click the button below:</p>
                    
                    <div style="text-align: center;">
                        <a href="{submission_url}" class="button">Submit Your Quote</a>
                    </div>
                    
                    <p><strong>Alternative:</strong> If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 3px;">
                        {submission_url}
                    </p>
                    
                    <h4>📝 Submission Options:</h4>
                    <ul>
                        <li><strong>Form Entry:</strong> Fill out our structured form with item details, quantities, and pricing</li>
                        <li><strong>File Upload:</strong> Upload your existing quote in PDF or Excel format</li>
                    </ul>
                    
                    <p>If you have any questions about this RFQ, please don't hesitate to contact us.</p>
                    
                    <p>Thank you for your interest in working with us.</p>
                    
                    <p>Best regards,<br>
                    <strong>AutoProcure Team</strong></p>
                </div>
                
                <div class="footer">
                    <p>This is an automated message from AutoProcure. Please do not reply to this email.</p>
                    <p>© 2025 AutoProcure. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _create_rfq_email_text(self, vendor_name: str, rfq_title: str, 
                              rfq_description: str, deadline: datetime, 
                              unique_link: str, base_url: str) -> str:
        """Create plain text email content"""
        deadline_str = deadline.strftime("%B %d, %Y at %I:%M %p")
        submission_url = f"{base_url}/vendor-submit/{unique_link}"
        
        return f"""
        AutoProcure - Request for Quotation (RFQ)
        
        Dear {vendor_name},
        
        We are pleased to invite you to participate in our Request for Quotation (RFQ) process.
        
        RFQ Details:
        Title: {rfq_title}
        Description: {rfq_description}
        
        Important Deadline:
        Submission Deadline: {deadline_str}
        
        To submit your quotation, please visit:
        {submission_url}
        
        Submission Options:
        - Form Entry: Fill out our structured form with item details, quantities, and pricing
        - File Upload: Upload your existing quote in PDF or Excel format
        
        If you have any questions about this RFQ, please don't hesitate to contact us.
        
        Thank you for your interest in working with us.
        
        Best regards,
        AutoProcure Team
        
        ---
        This is an automated message from AutoProcure. Please do not reply to this email.
        © 2025 AutoProcure. All rights reserved.
        """
    
    def send_submission_confirmation(self, vendor_email: str, vendor_name: str, 
                                   submission_id: str, rfq_title: str) -> bool:
        """Send confirmation email after vendor submission"""
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"Quote Submission Confirmed - {rfq_title}"
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = vendor_email
            
            # Create content
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px; }}
                    .content {{ padding: 20px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>✅ Quote Submission Confirmed</h2>
                    </div>
                    <div class="content">
                        <p>Dear {vendor_name},</p>
                        <p>Thank you for submitting your quote for <strong>{rfq_title}</strong>.</p>
                        <p><strong>Submission Reference:</strong> {submission_id}</p>
                        <p>We have received your submission and will review it as part of our procurement process.</p>
                        <p>You will be notified of the outcome once our evaluation is complete.</p>
                        <p>Best regards,<br>AutoProcure Team</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_content = f"""
            Quote Submission Confirmed
            
            Dear {vendor_name},
            
            Thank you for submitting your quote for {rfq_title}.
            
            Submission Reference: {submission_id}
            
            We have received your submission and will review it as part of our procurement process.
            You will be notified of the outcome once our evaluation is complete.
            
            Best regards,
            AutoProcure Team
            """
            
            part1 = MIMEText(text_content, 'plain')
            part2 = MIMEText(html_content, 'html')
            
            msg.attach(part1)
            msg.attach(part2)
            
            # Send email (same logic as RFQ email)
            if self.smtp_username and self.smtp_password:
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
                server.quit()
            else:
                logger.info(f"Confirmation email would be sent to {vendor_email}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to send confirmation email to {vendor_email}: {str(e)}")
            return False
