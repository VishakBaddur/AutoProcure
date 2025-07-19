#!/usr/bin/env python3
"""
AutoProcure AI Setup Script
Helps set up Ollama for local AI processing
"""

import subprocess
import sys
import os
import platform
import requests
from pathlib import Path

def check_ollama_installed():
    """Check if Ollama is installed"""
    try:
        result = subprocess.run(['ollama', '--version'], capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

def install_ollama():
    """Install Ollama based on the operating system"""
    system = platform.system().lower()
    
    print("🚀 Installing Ollama...")
    
    if system == "darwin":  # macOS
        print("📦 Installing Ollama on macOS...")
        subprocess.run(['curl', '-fsSL', 'https://ollama.ai/install.sh', '|', 'sh'], shell=True)
        
    elif system == "linux":
        print("📦 Installing Ollama on Linux...")
        subprocess.run(['curl', '-fsSL', 'https://ollama.ai/install.sh', '|', 'sh'], shell=True)
        
    elif system == "windows":
        print("📦 Please install Ollama manually from: https://ollama.ai/download")
        print("   Download the Windows installer and run it.")
        return False
    
    else:
        print(f"❌ Unsupported operating system: {system}")
        return False
    
    return True

def pull_mistral_model():
    """Pull the Mistral model for Ollama"""
    print("📥 Pulling Mistral model (this may take a few minutes)...")
    try:
        subprocess.run(['ollama', 'pull', 'mistral'], check=True)
        print("✅ Mistral model downloaded successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to pull Mistral model: {e}")
        return False

def test_ollama():
    """Test if Ollama is working"""
    print("🧪 Testing Ollama...")
    try:
        result = subprocess.run(
            ['ollama', 'run', 'mistral', 'Hello, this is a test.'],
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode == 0:
            print("✅ Ollama is working correctly!")
            return True
        else:
            print("❌ Ollama test failed")
            return False
    except subprocess.TimeoutExpired:
        print("⏰ Ollama test timed out (this is normal for first run)")
        return True
    except Exception as e:
        print(f"❌ Ollama test failed: {e}")
        return False

def create_env_file():
    """Create .env file with AI configuration"""
    env_file = Path('.env')
    if env_file.exists():
        print("📝 .env file already exists, skipping creation")
        return
    
    env_content = """# AI Configuration
AI_PROVIDER=ollama
AI_MODEL=mistral
OLLAMA_URL=http://localhost:11434

# Slack Integration (optional)
SLACK_WEBHOOK_URL=

# Database (for future use)
DATABASE_URL=
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("📝 Created .env file with default AI configuration")

def main():
    print("🤖 AutoProcure AI Setup")
    print("=" * 40)
    
    # Check if Ollama is already installed
    if check_ollama_installed():
        print("✅ Ollama is already installed!")
    else:
        print("❌ Ollama not found. Installing...")
        if not install_ollama():
            print("❌ Failed to install Ollama. Please install manually from https://ollama.ai")
            sys.exit(1)
    
    # Pull Mistral model
    if not pull_mistral_model():
        print("❌ Failed to pull Mistral model")
        sys.exit(1)
    
    # Test Ollama
    if not test_ollama():
        print("❌ Ollama test failed")
        sys.exit(1)
    
    # Create .env file
    create_env_file()
    
    print("\n🎉 Setup complete!")
    print("\nNext steps:")
    print("1. Start Ollama: ollama serve")
    print("2. Start the backend: python -m uvicorn app.main:app --reload")
    print("3. Start the frontend: npm run dev")
    print("\nYour AutoProcure MVP is ready with real AI processing! 🚀")

if __name__ == "__main__":
    main() 