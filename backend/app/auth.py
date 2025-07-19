import os
import jwt
import httpx
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from .database import db

class AuthManager:
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_anon_key = os.getenv('SUPABASE_ANON_KEY')
        self.jwt_secret = os.getenv('JWT_SECRET', 'your-secret-key')
        
    async def create_user(self, email: str, password: str, name: str = None) -> Dict[str, Any]:
        """Create a new user account"""
        if not self.supabase_url or not self.supabase_anon_key:
            # Fallback to local user creation
            return await self._create_local_user(email, password, name)
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.supabase_url}/auth/v1/signup",
                    headers={
                        "apikey": self.supabase_anon_key,
                        "Content-Type": "application/json"
                    },
                    json={
                        "email": email,
                        "password": password,
                        "data": {"name": name} if name else {}
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    user = data.get("user", {})
                    
                    # Create user record in our database
                    await self._create_user_record(user["id"], email, name)
                    
                    return {
                        "success": True,
                        "user_id": user["id"],
                        "email": user["email"],
                        "message": "User created successfully"
                    }
                else:
                    error_data = response.json()
                    return {
                        "success": False,
                        "error": error_data.get("error_description", "Failed to create user")
                    }
                    
        except Exception as e:
            print(f"Supabase auth error: {str(e)}")
            # Fallback to local user creation
            return await self._create_local_user(email, password, name)
    
    async def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """Login user and return JWT token"""
        if not self.supabase_url or not self.supabase_anon_key:
            # Fallback to local authentication
            return await self._login_local_user(email, password)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.supabase_url}/auth/v1/token?grant_type=password",
                    headers={
                        "apikey": self.supabase_anon_key,
                        "Content-Type": "application/json"
                    },
                    json={
                        "email": email,
                        "password": password
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    user = data.get("user", {})
                    access_token = data.get("access_token")

                    # Ensure user record exists in our users table
                    user_id = user.get("id")
                    user_email = user.get("email")
                    user_name = None
                    user_metadata = user.get("user_metadata")
                    if user_metadata and isinstance(user_metadata, dict):
                        user_name = user_metadata.get("name")
                    await self._create_user_record(user_id, user_email, user_name)

                    return {
                        "success": True,
                        "user_id": user_id,
                        "email": user_email,
                        "access_token": access_token,
                        "message": "Login successful"
                    }
                else:
                    error_data = response.json()
                    return {
                        "success": False,
                        "error": error_data.get("error_description", "Invalid credentials")
                    }
        
        except Exception as e:
            print(f"Supabase auth error: {str(e)}")
            # Fallback to local authentication
            return await self._login_local_user(email, password)
    
    async def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token and return user info"""
        if not self.supabase_url or not self.supabase_anon_key:
            # Fallback to local token verification
            return await self._verify_local_token(token)
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.supabase_url}/auth/v1/user",
                    headers={
                        "apikey": self.supabase_anon_key,
                        "Authorization": f"Bearer {token}"
                    }
                )
                
                if response.status_code == 200:
                    user_data = response.json()
                    return {
                        "user_id": user_data["id"],
                        "email": user_data["email"],
                        "name": user_data.get("user_metadata", {}).get("name")
                    }
                else:
                    return None
                    
        except Exception as e:
            print(f"Token verification error: {str(e)}")
            # Fallback to local token verification
            return await self._verify_local_token(token)
    
    async def _create_local_user(self, email: str, password: str, name: str = None) -> Dict[str, Any]:
        """Create user in local database (fallback)"""
        try:
            if not db.pool:
                return {"success": False, "error": "Database not available"}
                
            async with db.pool.acquire() as conn:
                # Check if user already exists
                existing_user = await conn.fetchrow(
                    "SELECT id FROM users WHERE email = $1", email
                )
                
                if existing_user:
                    return {"success": False, "error": "User already exists"}
                
                # Create new user
                user_id = await conn.fetchval("""
                    INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id
                """, email, name)
                
                return {
                    "success": True,
                    "user_id": str(user_id),
                    "email": email,
                    "message": "User created successfully (local)"
                }
                
        except Exception as e:
            return {"success": False, "error": f"Failed to create user: {str(e)}"}
    
    async def _login_local_user(self, email: str, password: str) -> Dict[str, Any]:
        """Local user authentication (fallback)"""
        try:
            if not db.pool:
                return {"success": False, "error": "Database not available"}
                
            async with db.pool.acquire() as conn:
                user = await conn.fetchrow(
                    "SELECT id, email, name FROM users WHERE email = $1", email
                )
                
                if not user:
                    return {"success": False, "error": "User not found"}
                
                # Generate JWT token
                token = jwt.encode(
                    {
                        "user_id": str(user["id"]),
                        "email": user["email"],
                        "exp": datetime.utcnow() + timedelta(days=7)
                    },
                    self.jwt_secret,
                    algorithm="HS256"
                )
                
                return {
                    "success": True,
                    "user_id": str(user["id"]),
                    "email": user["email"],
                    "access_token": token,
                    "message": "Login successful (local)"
                }
                
        except Exception as e:
            return {"success": False, "error": f"Login failed: {str(e)}"}
    
    async def _verify_local_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify local JWT token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            return {
                "user_id": payload["user_id"],
                "email": payload["email"]
            }
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    async def _create_user_record(self, user_id: str, email: str, name: str = None):
        """Create or update user record in our database"""
        try:
            if not db.pool:
                return

            async with db.pool.acquire() as conn:
                # Check if user with this email exists
                existing = await conn.fetchrow("SELECT id FROM users WHERE email = $1", email)
                if existing:
                    if str(existing["id"]) != str(user_id):
                        # Update the UUID to match Supabase Auth
                        await conn.execute(
                            "UPDATE users SET id = $1, name = $2 WHERE email = $3",
                            user_id, name, email
                        )
                else:
                    await conn.execute(
                        """INSERT INTO users (id, email, name) VALUES ($1, $2, $3)
                        ON CONFLICT (id) DO NOTHING""", user_id, email, name
                    )
        except Exception as e:
            print(f"Failed to create/update user record: {str(e)}")

# Global auth manager instance
auth_manager = AuthManager() 