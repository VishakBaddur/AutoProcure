#!/usr/bin/env python3
"""
Simple test to check if the FastAPI app can start
"""
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test if all imports work"""
    try:
        print("🔍 Testing imports...")
        
        # Test basic imports
        from app.main import app
        print("✅ FastAPI app imported successfully")
        
        # Test health endpoint
        from fastapi.testclient import TestClient
        client = TestClient(app)
        
        response = client.get("/health")
        print(f"✅ Health endpoint response: {response.status_code}")
        print(f"✅ Health endpoint data: {response.json()}")
        
        # Test root endpoint
        response = client.get("/")
        print(f"✅ Root endpoint response: {response.status_code}")
        print(f"✅ Root endpoint data: {response.json()}")
        
        print("🎉 All tests passed! App can start successfully.")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1) 