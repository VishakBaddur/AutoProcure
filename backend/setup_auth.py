#!/usr/bin/env python3
"""
AutoProcure Authentication Setup Script
Configures Supabase Auth and generates JWT secret
"""

import os
import secrets
import subprocess
import sys
from pathlib import Path

def generate_jwt_secret():
    """Generate a secure JWT secret"""
    return secrets.token_urlsafe(32)

def update_env_file():
    """Update .env file with authentication configuration"""
    env_file = Path('.env')
    
    if not env_file.exists():
        print("❌ .env file not found. Please run setup_database.py first.")
        return False
    
    # Read existing .env content
    with open(env_file, 'r') as f:
        content = f.read()
    
    # Generate JWT secret
    jwt_secret = generate_jwt_secret()
    
    # Check if auth config already exists
    if 'SUPABASE_URL=' in content:
        print("⚠️  Authentication configuration already exists in .env")
        print("   Update these values manually if needed:")
        print(f"   SUPABASE_URL=https://your-project.supabase.co")
        print(f"   SUPABASE_ANON_KEY=your-anon-key")
        print(f"   JWT_SECRET={jwt_secret}")
        return True
    
    # Add auth configuration
    auth_config = f"""

# Supabase Auth Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
JWT_SECRET={jwt_secret}
"""
    
    with open(env_file, 'a') as f:
        f.write(auth_config)
    
    print("✅ Added authentication configuration to .env")
    print(f"🔑 Generated JWT secret: {jwt_secret}")
    return True

def install_dependencies():
    """Install authentication dependencies"""
    print("📦 Installing authentication dependencies...")
    
    try:
        subprocess.run([
            sys.executable, '-m', 'pip', 'install', 'PyJWT'
        ], check=True, capture_output=True)
        print("✅ Authentication dependencies installed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def print_setup_instructions():
    """Print setup instructions for Supabase Auth"""
    print("\n" + "="*60)
    print("🔐 SUPABASE AUTH SETUP INSTRUCTIONS")
    print("="*60)
    print()
    print("1. Go to your Supabase project dashboard:")
    print("   https://supabase.com/dashboard")
    print()
    print("2. Navigate to Settings > API")
    print()
    print("3. Copy the following values to your .env file:")
    print("   - Project URL → SUPABASE_URL")
    print("   - anon/public key → SUPABASE_ANON_KEY")
    print()
    print("4. Enable Email Auth in Authentication > Providers")
    print()
    print("5. (Optional) Configure email templates in Authentication > Templates")
    print()
    print("6. Test the setup by running:")
    print("   python -m uvicorn app.main:app --reload")
    print()
    print("7. Visit http://localhost:3000 to test authentication")
    print()

def main():
    print("🚀 AutoProcure Authentication Setup")
    print("="*40)
    
    # Check if we're in the backend directory
    if not Path('app').exists():
        print("❌ Please run this script from the backend directory")
        return
    
    # Install dependencies
    if not install_dependencies():
        return
    
    # Update .env file
    if not update_env_file():
        return
    
    # Print instructions
    print_setup_instructions()
    
    print("✅ Authentication setup complete!")
    print("   Next: Configure Supabase Auth and test the application")

if __name__ == "__main__":
    main() 