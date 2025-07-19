#!/usr/bin/env python3
"""
Update .env file with Supabase credentials
"""

import os
from pathlib import Path

def update_env_file():
    """Update .env file with Supabase credentials"""
    env_file = Path('.env')
    
    # Your Supabase credentials
    supabase_url = "https://kycsdqamiacdgcjhkedp.supabase.co"
    supabase_anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5Y3NkcWFtaWFjZGdjamhrZWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTI1MzAsImV4cCI6MjA2NzM4ODUzMH0.c5PN7jFZbzdrAl4WOf9oeyG6IT3BmF-UddpyCCAJ6_E"
    jwt_secret = "1YC8g-SlKputl3WlEE-psO1Pk_Or6yhoxPRDhV_hs9o"
    
    # Check if .env exists
    if env_file.exists():
        print("✅ .env file found")
        
        # Read existing content
        with open(env_file, 'r') as f:
            content = f.read()
        
        # Update Supabase credentials
        lines = content.split('\n')
        updated_lines = []
        
        for line in lines:
            if line.startswith('SUPABASE_URL='):
                updated_lines.append(f'SUPABASE_URL={supabase_url}')
            elif line.startswith('SUPABASE_ANON_KEY='):
                updated_lines.append(f'SUPABASE_ANON_KEY={supabase_anon_key}')
            elif line.startswith('JWT_SECRET='):
                updated_lines.append(f'JWT_SECRET={jwt_secret}')
            else:
                updated_lines.append(line)
        
        # Write back to file
        with open(env_file, 'w') as f:
            f.write('\n'.join(updated_lines))
        
        print("✅ Updated .env file with your Supabase credentials")
        
    else:
        print("❌ .env file not found. Please run setup_auth.py first.")
        return False
    
    return True

def print_next_steps():
    """Print next steps for testing"""
    print("\n" + "="*60)
    print("🚀 NEXT STEPS TO TEST AUTHENTICATION")
    print("="*60)
    print()
    print("1. Start the backend server:")
    print("   python -m uvicorn app.main:app --reload")
    print()
    print("2. In another terminal, start the frontend:")
    print("   cd ../frontend")
    print("   npm install")
    print("   npm run dev")
    print()
    print("3. Visit http://localhost:3000")
    print()
    print("4. Test authentication:")
    print("   - Click 'Sign Up' to create an account")
    print("   - Upload a quote file to test the full workflow")
    print("   - Check the quote history feature")
    print()
    print("5. Verify Supabase Auth is working:")
    print("   - Go to your Supabase dashboard")
    print("   - Check Authentication > Users for new accounts")
    print("   - Check Database > Tables for quote data")
    print()

def main():
    print("🔧 Updating .env with Supabase Credentials")
    print("="*50)
    
    if update_env_file():
        print_next_steps()
        print("✅ Ready to test authentication!")

if __name__ == "__main__":
    main() 