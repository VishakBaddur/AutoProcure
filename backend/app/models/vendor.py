from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from pydantic import BaseModel
from typing import Optional

Base = declarative_base()

class Vendor(Base):
    __tablename__ = "vendors"
    
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    company = Column(String, nullable=True)
    email = Column(String, nullable=False, unique=True, index=True)
    phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    rfq_participations = relationship("RFQParticipation", back_populates="vendor")

class RFQ(Base):
    __tablename__ = "rfqs"
    
    id = Column(Integer, primary_key=True, index=True)
    rfq_id = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    deadline = Column(DateTime, nullable=False)
    total_budget = Column(String, nullable=True)  # Store as string for flexibility
    currency = Column(String, default="USD")
    status = Column(String, default="active")  # active, closed, cancelled
    created_by = Column(String, nullable=False)  # User ID or email
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    participations = relationship("RFQParticipation", back_populates="rfq")

class RFQParticipation(Base):
    __tablename__ = "rfq_participations"
    
    id = Column(Integer, primary_key=True, index=True)
    participation_id = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    rfq_id = Column(String, ForeignKey("rfqs.rfq_id"), nullable=False)
    vendor_id = Column(String, ForeignKey("vendors.vendor_id"), nullable=False)
    unique_link = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    email_sent = Column(Boolean, default=False)
    email_sent_at = Column(DateTime, nullable=True)
    status = Column(String, default="pending")  # pending, submitted, reviewed, rejected
    submitted_at = Column(DateTime, nullable=True)
    submission_data = Column(Text, nullable=True)  # JSON string of submission
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    rfq = relationship("RFQ", back_populates="participations")
    vendor = relationship("Vendor", back_populates="rfq_participations")

# Pydantic models for API
class VendorCreate(BaseModel):
    name: str
    company: Optional[str] = None
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None

class VendorResponse(BaseModel):
    vendor_id: str
    name: str
    company: Optional[str] = None
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class RFQCreate(BaseModel):
    title: str
    description: str
    deadline: datetime
    total_budget: Optional[str] = None
    currency: str = "USD"

class RFQResponse(BaseModel):
    rfq_id: str
    title: str
    description: str
    deadline: datetime
    total_budget: Optional[str] = None
    currency: str
    status: str
    created_by: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class RFQParticipationResponse(BaseModel):
    participation_id: str
    rfq_id: str
    vendor_id: str
    unique_link: str
    email_sent: bool
    email_sent_at: Optional[datetime] = None
    status: str
    submitted_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True