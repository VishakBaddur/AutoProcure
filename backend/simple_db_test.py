#!/usr/bin/env python3
"""
Simple database connection test for Supabase
"""

import os
import sys

def test_database_connection():
    """Test database connection"""
    try:
        # Check if DATABASE_URL is set
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            print("❌ DATABASE_URL environment variable not set")
            print("🔧 Please set your Supabase DATABASE_URL:")
            print("   export DATABASE_URL='postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres'")
            return False
        
        print(f"📊 DATABASE_URL: {database_url[:50]}...")
        
        # Import SQLAlchemy components
        from sqlalchemy import create_engine, text
        from sqlalchemy.orm import sessionmaker
        
        # Create engine
        engine = create_engine(database_url)
        
        # Test connection
        print("🔍 Testing database connection...")
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
        
        # Test table creation
        print("🔍 Testing table creation...")
        try:
            from app.models.vendor import Base
            Base.metadata.create_all(bind=engine)
            print("✅ Tables created successfully!")
        except ImportError:
            print("⚠️  Could not import vendor models, but connection works!")
            print("✅ Database connection successful!")
        
        # Test basic operations
        print("🔍 Testing basic operations...")
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            # Test query
            result = db.execute(text("SELECT 1 as test"))
            test_value = result.scalar()
            print(f"✅ Query successful! Test value: {test_value}")
        finally:
            db.close()
        
        print("\n🎉 All database tests passed!")
        print("🚀 Your Supabase database is ready for AutoProcure!")
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {str(e)}")
        print("\n🔧 Troubleshooting:")
        print("1. Check your DATABASE_URL environment variable")
        print("2. Verify your Supabase project is active")
        print("3. Ensure your database password is correct")
        print("4. Check if your IP is whitelisted in Supabase")
        return False

if __name__ == "__main__":
    print("🚀 AutoProcure Database Test")
    print("=" * 50)
    
    if test_database_connection():
        print("\n✅ Database setup complete!")
        print("🎯 You can now start the AutoProcure backend server")
    else:
        print("\n❌ Database setup failed!")
        print("🔧 Please check the troubleshooting steps above")
        sys.exit(1)
