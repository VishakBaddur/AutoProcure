import pandas as pd
import io
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
import uuid
import json

from ..models.vendor import Vendor, RFQ, RFQParticipation, VendorCreate, RFQCreate
from ..database import get_db

class VendorService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_vendor(self, vendor_data: VendorCreate) -> Vendor:
        """Create a new vendor"""
        try:
            vendor = Vendor(
                name=vendor_data.name,
                company=vendor_data.company,
                email=vendor_data.email,
                phone=vendor_data.phone,
                address=vendor_data.address
            )
            self.db.add(vendor)
            self.db.commit()
            self.db.refresh(vendor)
            return vendor
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Failed to create vendor: {str(e)}")
    
    def create_rfq(self, rfq_data: RFQCreate, created_by: str) -> RFQ:
        """Create a new RFQ"""
        rfq = RFQ(
            title=rfq_data.title,
            description=rfq_data.description,
            deadline=rfq_data.deadline,
            total_budget=rfq_data.total_budget,
            currency=rfq_data.currency,
            created_by=created_by
        )
        self.db.add(rfq)
        self.db.commit()
        self.db.refresh(rfq)
        return rfq
    
    def upload_vendor_list(self, file_content: bytes, filename: str, rfq_id: str) -> Dict[str, Any]:
        """Upload and process vendor list from CSV/Excel file"""
        try:
            # Determine file type and read data
            if filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(file_content))
            elif filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(io.BytesIO(file_content))
            else:
                raise ValueError("Unsupported file format. Please upload CSV or Excel file.")

            # Normalize headers: case-insensitive, trim, common aliases
            original_columns = list(df.columns)
            normalized = {}
            for col in original_columns:
                key = str(col).strip().lower().replace('-', ' ').replace('_', ' ')
                key = ' '.join(key.split())  # collapse spaces
                if key in ['name', 'vendor', 'vendor name', 'contact', 'contact name']:
                    normalized[col] = 'name'
                elif key in ['company', 'company name', 'organisation', 'organization']:
                    normalized[col] = 'company'
                elif key in ['email', 'email address', 'e-mail']:
                    normalized[col] = 'email'
                elif key in ['phone', 'phone number', 'mobile']:
                    normalized[col] = 'phone'
                elif key in ['address', 'location']:
                    normalized[col] = 'address'
                else:
                    # Keep untouched for any additional columns
                    normalized[col] = str(col)

            df = df.rename(columns=normalized)

            # Validate required columns
            required_columns = ['name', 'company', 'email']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                # Provide helpful message including what we saw
                raise ValueError(
                    f"Missing required columns: {missing_columns}. Found columns: {list(df.columns)}. "
                    "Required: name, company, email (case-insensitive)."
                )

            # Clean and validate data
            df = df.dropna(subset=required_columns)
            if 'email' in df.columns:
                df['email'] = df['email'].astype(str).str.strip().str.lower()
            
            # Remove duplicates based on email
            df = df.drop_duplicates(subset=['email'])
            
            vendors_created = []
            vendors_existing = []
            errors = []
            
            # Process each vendor
            for index, row in df.iterrows():
                try:
                    # Check if vendor already exists
                    existing_vendor = self.db.query(Vendor).filter(
                        Vendor.email == row['email']
                    ).first()
                    
                    if existing_vendor:
                        vendors_existing.append({
                            'name': existing_vendor.name,
                            'company': existing_vendor.company,
                            'email': existing_vendor.email
                        })
                    else:
                        # Create new vendor
                        vendor_data = VendorCreate(
                            name=str(row['name']).strip(),
                            company=str(row['company']).strip(),
                            email=str(row['email']).strip(),
                            phone=str(row.get('phone', '')).strip() if pd.notna(row.get('phone')) else None,
                            address=str(row.get('address', '')).strip() if pd.notna(row.get('address')) else None
                        )
                        
                        vendor = self.create_vendor(vendor_data)
                        vendors_created.append({
                            'vendor_id': vendor.vendor_id,
                            'name': vendor.name,
                            'company': vendor.company,
                            'email': vendor.email
                        })
                    
                    # Create RFQ participation
                    vendor_to_use = existing_vendor if existing_vendor else vendor
                    participation = self.create_rfq_participation(rfq_id, vendor_to_use.vendor_id)
                    
                except Exception as e:
                    errors.append(f"Row {index + 2}: {str(e)}")
            
            return {
                'success': True,
                'vendors_created': len(vendors_created),
                'vendors_existing': len(vendors_existing),
                'total_processed': len(df),
                'errors': errors,
                'vendors_created_list': vendors_created,
                'vendors_existing_list': vendors_existing
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_rfq_participation(self, rfq_id: str, vendor_id: str) -> RFQParticipation:
        """Create RFQ participation for a vendor"""
        participation = RFQParticipation(
            rfq_id=rfq_id,
            vendor_id=vendor_id,
            unique_link=str(uuid.uuid4())
        )
        self.db.add(participation)
        self.db.commit()
        self.db.refresh(participation)
        return participation
    
    def get_rfq_participations(self, rfq_id: str) -> List[RFQParticipation]:
        """Get all participations for an RFQ"""
        return self.db.query(RFQParticipation).filter(
            RFQParticipation.rfq_id == rfq_id
        ).all()
    
    def get_vendor_by_link(self, unique_link: str) -> Optional[RFQParticipation]:
        """Get vendor participation by unique link"""
        return self.db.query(RFQParticipation).filter(
            RFQParticipation.unique_link == unique_link
        ).first()
    
    def update_participation_status(self, participation_id: str, status: str, submission_data: Optional[Dict] = None) -> bool:
        """Update participation status"""
        participation = self.db.query(RFQParticipation).filter(
            RFQParticipation.participation_id == participation_id
        ).first()
        
        if not participation:
            return False
        
        participation.status = status
        if status == "submitted":
            participation.submitted_at = datetime.utcnow()
            if submission_data:
                participation.submission_data = json.dumps(submission_data)
        
        self.db.commit()
        return True
    
    def mark_email_sent(self, participation_id: str) -> bool:
        """Mark email as sent for a participation"""
        participation = self.db.query(RFQParticipation).filter(
            RFQParticipation.participation_id == participation_id
        ).first()
        
        if not participation:
            return False
        
        participation.email_sent = True
        participation.email_sent_at = datetime.utcnow()
        self.db.commit()
        return True
    
    def get_rfq_by_id(self, rfq_id: str) -> Optional[RFQ]:
        """Get RFQ by ID"""
        try:
            return self.db.query(RFQ).filter(RFQ.rfq_id == rfq_id).first()
        except Exception as e:
            print(f"Error getting RFQ by ID: {str(e)}")
            return None
    
    def get_rfq_dashboard_data(self, rfq_id: str) -> Dict[str, Any]:
        """Get dashboard data for an RFQ"""
        participations = self.get_rfq_participations(rfq_id)
        
        total_vendors = len(participations)
        emails_sent = len([p for p in participations if p.email_sent])
        submissions_received = len([p for p in participations if p.status == "submitted"])
        pending = len([p for p in participations if p.status == "pending"])
        
        return {
            'rfq_id': rfq_id,
            'total_vendors': total_vendors,
            'emails_sent': emails_sent,
            'submissions_received': submissions_received,
            'pending': pending,
            'participation_rate': (submissions_received / total_vendors * 100) if total_vendors > 0 else 0,
            'participations': [
                {
                    'participation_id': p.participation_id,
                    'vendor_name': p.vendor.name,
                    'vendor_company': p.vendor.company,
                    'vendor_email': p.vendor.email,
                    'status': p.status,
                    'email_sent': p.email_sent,
                    'email_sent_at': p.email_sent_at,
                    'submitted_at': p.submitted_at,
                    'unique_link': p.unique_link
                }
                for p in participations
            ]
        }
