#!/usr/bin/env python3
"""
Database connection test script for Supabase
Run this to verify your database connection and table creation
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_database_connection():
    """Test database connection and table creation"""
    try:
        # Import after loading environment variables
        from app.database_sqlalchemy import engine, SessionLocal
        from app.models.vendor import Base, Vendor, RFQ, RFQParticipation
        
        print("🔍 Testing database connection...")
        
        # Test connection
        with engine.connect() as connection:
            result = connection.execute("SELECT 1")
            print("✅ Database connection successful!")
        
        # Create tables
        print("🔍 Creating tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully!")
        
        # Test database operations
        print("🔍 Testing database operations...")
        db = SessionLocal()
        
        try:
            # Test creating a vendor
            test_vendor = Vendor(
                name="Test Vendor",
                company="Test Company",
                email="test@example.com"
            )
            db.add(test_vendor)
            db.commit()
            db.refresh(test_vendor)
            print(f"✅ Vendor created with ID: {test_vendor.vendor_id}")
            
            # Test creating an RFQ
            from datetime import datetime, timedelta
            test_rfq = RFQ(
                title="Test RFQ",
                description="Test RFQ Description",
                deadline=datetime.utcnow() + timedelta(days=30),
                total_budget="10000",
                currency="USD",
                created_by="test@example.com"
            )
            db.add(test_rfq)
            db.commit()
            db.refresh(test_rfq)
            print(f"✅ RFQ created with ID: {test_rfq.rfq_id}")
            
            # Test creating participation
            test_participation = RFQParticipation(
                rfq_id=test_rfq.rfq_id,
                vendor_id=test_vendor.vendor_id,
                unique_link="test-unique-link"
            )
            db.add(test_participation)
            db.commit()
            db.refresh(test_participation)
            print(f"✅ Participation created with ID: {test_participation.participation_id}")
            
            # Clean up test data
            db.delete(test_participation)
            db.delete(test_rfq)
            db.delete(test_vendor)
            db.commit()
            print("✅ Test data cleaned up")
            
        finally:
            db.close()
        
        print("\n🎉 All database tests passed!")
        print("🚀 Your Supabase database is ready for AutoProcure!")
        
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {str(e)}")
        print("\n🔧 Troubleshooting:")
        print("1. Check your DATABASE_URL in .env file")
        print("2. Verify your Supabase project is active")
        print("3. Ensure your database password is correct")
        print("4. Check Supabase logs for any errors")
        return False

def show_database_info():
    """Show current database configuration"""
    database_url = os.getenv("DATABASE_URL", "Not set")
    
    print("📊 Current Database Configuration:")
    print(f"   DATABASE_URL: {database_url[:50]}..." if len(database_url) > 50 else f"   DATABASE_URL: {database_url}")
    
    if database_url.startswith("postgresql"):
        print("   ✅ Using PostgreSQL (Supabase)")
    elif database_url.startswith("sqlite"):
        print("   ⚠️  Using SQLite (Development mode)")
    else:
        print("   ❌ Unknown database type")

if __name__ == "__main__":
    print("🚀 AutoProcure Database Test")
    print("=" * 50)
    
    show_database_info()
    print()
    
    if test_database_connection():
        print("\n✅ Database setup complete!")
        print("🎯 You can now start the AutoProcure backend server")
    else:
        print("\n❌ Database setup failed!")
        print("🔧 Please check the troubleshooting steps above")
        sys.exit(1)
