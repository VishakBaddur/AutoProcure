import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.smtp_from = os.getenv("SMTP_FROM", self.smtp_user)
    
    def send_rfq_email(self, vendor_email: str, vendor_name: str, rfq_title: str, 
                      rfq_description: str, deadline: str, unique_link: str) -> bool:
        """Send RFQ invitation email to vendor"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"RFQ Invitation: {rfq_title}"
            msg['From'] = self.smtp_from
            msg['To'] = vendor_email
            
            # HTML content
            html_content = f"""
            <html>
            <body>
                <h2>RFQ Invitation</h2>
                <p>Dear {vendor_name},</p>
                
                <p>You have been invited to participate in the following Request for Quote (RFQ):</p>
                
                <h3>{rfq_title}</h3>
                <p><strong>Description:</strong> {rfq_description}</p>
                <p><strong>Deadline:</strong> {deadline}</p>
                
                <p>Please click the link below to submit your quote:</p>
                <p><a href="{unique_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Submit Quote</a></p>
                
                <p>If you have any questions, please contact us.</p>
                
                <p>Best regards,<br>Procurement Team</p>
            </body>
            </html>
            """
            
            # Plain text content
            text_content = f"""
            RFQ Invitation
            
            Dear {vendor_name},
            
            You have been invited to participate in the following Request for Quote (RFQ):
            
            Title: {rfq_title}
            Description: {rfq_description}
            Deadline: {deadline}
            
            Please use the following link to submit your quote:
            {unique_link}
            
            If you have any questions, please contact us.
            
            Best regards,
            Procurement Team
            """
            
            # Attach parts
            part1 = MIMEText(text_content, 'plain')
            part2 = MIMEText(html_content, 'html')
            
            msg.attach(part1)
            msg.attach(part2)
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"RFQ email sent successfully to {vendor_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send RFQ email to {vendor_email}: {str(e)}")
            return False
    
    def send_submission_confirmation(self, vendor_email: str, vendor_name: str, 
                                   submission_id: str, rfq_title: str) -> bool:
        """Send submission confirmation email to vendor"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"Quote Submission Confirmed: {rfq_title}"
            msg['From'] = self.smtp_from
            msg['To'] = vendor_email
            
            # HTML content
            html_content = f"""
            <html>
            <body>
                <h2>Quote Submission Confirmed</h2>
                <p>Dear {vendor_name},</p>
                
                <p>Thank you for submitting your quote for:</p>
                <h3>{rfq_title}</h3>
                
                <p>Your submission has been received and is being reviewed.</p>
                <p><strong>Submission ID:</strong> {submission_id}</p>
                
                <p>We will contact you with the results once the evaluation is complete.</p>
                
                <p>Best regards,<br>Procurement Team</p>
            </body>
            </html>
            """
            
            # Plain text content
            text_content = f"""
            Quote Submission Confirmed
            
            Dear {vendor_name},
            
            Thank you for submitting your quote for:
            {rfq_title}
            
            Your submission has been received and is being reviewed.
            Submission ID: {submission_id}
            
            We will contact you with the results once the evaluation is complete.
            
            Best regards,
            Procurement Team
            """
            
            # Attach parts
            part1 = MIMEText(text_content, 'plain')
            part2 = MIMEText(html_content, 'html')
            
            msg.attach(part1)
            msg.attach(part2)
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Confirmation email sent successfully to {vendor_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send confirmation email to {vendor_email}: {str(e)}")
            return False