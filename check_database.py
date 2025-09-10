#!/usr/bin/env python3
"""
Database connection checker for AutoProcure
Run this to test database connectivity before deployment
"""

import os
import sys

def check_database_url():
    """Check if DATABASE_URL is properly configured"""
    database_url = os.getenv("DATABASE_URL")
    
    print("🔍 Database Configuration Check")
    print("=" * 50)
    
    if not database_url:
        print("❌ DATABASE_URL environment variable is not set")
        print("💡 For Render deployment, set DATABASE_URL in your environment variables")
        print("💡 For local development, it will use SQLite")
        return False
    
    print(f"✅ DATABASE_URL is set: {database_url[:20]}...")
    
    if database_url.startswith("postgresql"):
        print("✅ Using PostgreSQL (production)")
        return True
    elif database_url.startswith("sqlite"):
        print("✅ Using SQLite (development)")
        return True
    else:
        print(f"⚠️  Unknown database type: {database_url.split('://')[0]}")
        return False

def test_connection():
    """Test database connection"""
    try:
        from backend.app.database_sqlalchemy import engine
        with engine.connect() as conn:
            result = conn.execute("SELECT 1")
            print("✅ Database connection test successful")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    print("AutoProcure Database Checker")
    print("=" * 50)
    
    # Check configuration
    config_ok = check_database_url()
    
    if config_ok:
        # Test connection
        connection_ok = test_connection()
        
        if connection_ok:
            print("\n🎉 Database is ready!")
            sys.exit(0)
        else:
            print("\n⚠️  Database connection failed")
            sys.exit(1)
    else:
        print("\n⚠️  Database configuration issue")
        sys.exit(1)
