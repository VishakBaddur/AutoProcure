#!/usr/bin/env python3
"""
AutoProcure Supabase Setup Script
Helps set up Supabase database for quote storage
"""

import os
import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def check_database_connection():
    """Test database connection"""
    try:
        from app.database import db
        await db.connect()
        
        if db.pool:
            print("✅ Database connection successful!")
            return True
        else:
            print("⚠️  No database connection (using in-memory storage)")
            return False
            
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

def create_env_file():
    """Create or update .env file with database configuration"""
    env_file = Path('.env')
    
    # Read existing content
    existing_content = ""
    if env_file.exists():
        with open(env_file, 'r') as f:
            existing_content = f.read()
    
    # Check if DATABASE_URL already exists
    if 'DATABASE_URL=' in existing_content:
        print("📝 DATABASE_URL already configured in .env file")
        return
    
    print("📝 Adding database configuration to .env file...")
    
    # Add database configuration
    db_config = """
# Database Configuration (Supabase)
# Get this from your Supabase project settings > Database > Connection string
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

"""
    
    # Append to existing content
    with open(env_file, 'a') as f:
        f.write(db_config)
    
    print("📝 Added DATABASE_URL placeholder to .env file")

def print_supabase_instructions():
    """Print instructions for setting up Supabase"""
    print("\n" + "="*60)
    print("🗃️  SUPABASE SETUP INSTRUCTIONS")
    print("="*60)
    print("\n1. Create a Supabase account at https://supabase.com")
    print("2. Create a new project")
    print("3. Go to Project Settings > Database")
    print("4. Copy the 'Connection string' (URI format)")
    print("5. Replace [YOUR-PASSWORD] with your database password")
    print("6. Replace [YOUR-PROJECT-REF] with your project reference")
    print("\nExample DATABASE_URL:")
    print("postgresql://postgres:mypassword123@db.abcdefghijklmnop.supabase.co:5432/postgres")
    print("\n7. Update the .env file with your actual DATABASE_URL")
    print("8. Run this script again to test the connection")
    print("\n" + "="*60)

def main():
    print("🗃️  AutoProcure Supabase Setup")
    print("="*40)
    
    # Check if DATABASE_URL is configured
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ No DATABASE_URL found in environment")
        create_env_file()
        print_supabase_instructions()
        return
    
    if database_url.startswith('postgresql://postgres:[YOUR-PASSWORD]'):
        print("⚠️  DATABASE_URL still has placeholder values")
        print_supabase_instructions()
        return
    
    # Test database connection
    print("🧪 Testing database connection...")
    try:
        asyncio.run(check_database_connection())
        print("\n🎉 Supabase setup complete!")
        print("\nYour AutoProcure MVP now has persistent quote storage!")
        print("\nNext steps:")
        print("1. Start the backend: python -m uvicorn app.main:app --reload")
        print("2. Start the frontend: npm run dev")
        print("3. Upload quotes and see them saved to the database!")
        
    except Exception as e:
        print(f"❌ Setup failed: {str(e)}")
        print("\nPlease check your DATABASE_URL and try again.")

if __name__ == "__main__":
    main() 