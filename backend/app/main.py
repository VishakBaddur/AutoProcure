import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import pdfplumber
import openpyxl
import io
import json
from typing import List, Dict, Any, Optional
import httpx
from .models import QuoteItem, QuoteTerms, VendorQuote, AnalysisResult
from .slack import send_slack_alert
from .ai_processor import ai_processor
from .database import db
from .auth import auth_manager

app = FastAPI(title="AutoProcure API", version="1.0.0")

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Request models
class SignupRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    try:
        await db.connect()
        print("✅ Database connected successfully")
    except Exception as e:
        print(f"⚠️ Database connection failed: {e}")
        print("⚠️ App will continue without database functionality")

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections on shutdown"""
    try:
        if db.pool:
            await db.pool.close()
            print("✅ Database connection closed")
    except Exception as e:
        print(f"⚠️ Error closing database: {e}")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[Dict[str, Any]]:
    """Get current user from JWT token"""
    try:
        token = credentials.credentials
        user = await auth_manager.verify_token(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF using pdfplumber"""
    try:
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text() or ""
            return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF parsing error: {str(e)}")

def extract_text_from_excel(file_content: bytes) -> str:
    """Extract text from Excel using openpyxl"""
    try:
        workbook = openpyxl.load_workbook(io.BytesIO(file_content), data_only=True)
        text = ""
        for sheet_name in workbook.sheetnames:
            sheet = workbook[sheet_name]
            for row in sheet.iter_rows(values_only=True):
                text += " ".join(str(cell) for cell in row if cell) + "\n"
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Excel parsing error: {str(e)}")

@app.get("/")
async def root():
    return {"message": "AutoProcure API is running!"}

# Authentication endpoints
@app.post("/auth/signup")
async def signup(request: SignupRequest):
    """Create a new user account"""
    try:
        result = await auth_manager.create_user(request.email, request.password, request.name)
        if result["success"]:
            return {"message": result["message"], "user_id": result["user_id"]}
        else:
            raise HTTPException(status_code=400, detail=result["error"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@app.post("/auth/login")
async def login(request: LoginRequest):
    """Login user and get access token"""
    try:
        result = await auth_manager.login_user(request.email, request.password)
        if result["success"]:
            return {
                "message": result["message"],
                "user_id": result["user_id"],
                "access_token": result["access_token"]
            }
        else:
            raise HTTPException(status_code=401, detail=result["error"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/auth/me")
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@app.post("/upload", response_model=AnalysisResult)
async def upload_file(
    file: UploadFile = File(...),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user)
):
    """Upload and analyze vendor quote files with RAG context"""
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    file_extension = file.filename.lower().split('.')[-1]
    if file_extension not in ['pdf', 'xlsx', 'xls']:
        raise HTTPException(status_code=400, detail="Only PDF and Excel files are supported")
    try:
        # Read file content
        file_content = await file.read()
        # Extract text based on file type
        if file_extension == 'pdf':
            text_content = extract_text_from_pdf(file_content)
        else:
            text_content = extract_text_from_excel(file_content)
        # --- RAG: Retrieve relevant past quotes for context ---
        user_id = current_user["user_id"] if current_user else None
        # For RAG, we need SKUs. We'll extract them after AI analysis, so for the first run, just analyze as usual.
        initial_quote = await ai_processor.analyze_quote(text_content)
        skus = [item.sku for item in initial_quote.items]
        rag_context = ""
        if user_id and skus:
            past_quotes = await db.get_relevant_past_quotes(user_id, skus, limit=5)
            if past_quotes:
                rag_context = "\n".join([
                    f"Date: {q['created_at']}, Vendor: {q['vendor_name']}, SKU: {q['sku']}, Desc: {q['description']}, Qty: {q['quantity']}, Unit: {q['unit_price']}, Total: {q['total']}" for q in past_quotes
                ])
        # Now run the AI analysis again, this time with RAG context
        quote = await ai_processor.analyze_quote(text_content, rag_context=rag_context)
        # Create comparison and recommendation
        total_cost = sum(item.total for item in quote.items)
        delivery_time = quote.items[0].deliveryTime if quote.items else "N/A"
        comparison = {
            "totalCost": total_cost,
            "deliveryTime": delivery_time,
            "vendorCount": 1
        }
        # Generate smart recommendation
        if quote.vendorName == "Analysis Failed - Manual Review Required":
            recommendation = "AI analysis failed. Please manually review the uploaded document."
        else:
            recommendation = f"Vendor {quote.vendorName} offers competitive pricing with {delivery_time} delivery. Total quote value: ${total_cost:,.2f}"
        result = AnalysisResult(
            quotes=[quote],
            comparison=comparison,
            recommendation=recommendation
        )
        # Save to database with user ID
        user_email = current_user["email"] if current_user else None
        user_name = current_user.get("name") if current_user else None
        print(f"[UPLOAD] user_id={user_id}, email={user_email}, name={user_name}")
        # Defensive: ensure user exists in users table
        await auth_manager._create_user_record(user_id, user_email, user_name)
        quote_id = await db.save_quote_analysis(
            filename=file.filename,
            file_type=file_extension,
            raw_text=text_content,
            analysis_result=result,
            user_id=user_id
        )
        # Add quote ID to response
        result_dict = result.dict()
        result_dict["quote_id"] = quote_id
        # Send Slack alert
        await send_slack_alert(result)
        return result_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@app.get("/quotes")
async def get_quote_history(
    limit: int = 10,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user)
):
    """Get quote history for current user"""
    try:
        user_id = current_user["user_id"] if current_user else None
        quotes = await db.get_quote_history(user_id=user_id, limit=limit)
        return {"quotes": quotes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get quote history: {str(e)}")

@app.get("/quotes/{quote_id}")
async def get_quote(
    quote_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user)
):
    """Get specific quote by ID"""
    try:
        quote = await db.get_quote_by_id(quote_id)
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")
        
        # Check if user owns this quote (if authenticated)
        if current_user and quote.get("user_id") and quote["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
            
        return quote
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get quote: {str(e)}")

@app.get("/analytics")
async def get_analytics(current_user: Optional[Dict[str, Any]] = Depends(get_current_user)):
    """Get analytics data for current user"""
    try:
        user_id = current_user["user_id"] if current_user else None
        analytics = await db.get_analytics(user_id=user_id)
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint that works without database"""
    try:
        # Check if database is connected
        db_status = "connected" if db.pool else "disconnected"
        
        return {
            "status": "healthy", 
            "service": "AutoProcure API",
            "database": db_status,
            "timestamp": "2024-01-01T00:00:00Z"
        }
    except Exception as e:
        return {
            "status": "degraded",
            "service": "AutoProcure API", 
            "error": str(e),
            "timestamp": "2024-01-01T00:00:00Z"
        }

@app.get("/ai-status")
async def ai_status():
    """Check AI provider status"""
    ai_provider = os.getenv('AI_PROVIDER', 'ollama')
    model_name = os.getenv('AI_MODEL', 'mistral')
    
    return {
        "ai_provider": ai_provider,
        "model_name": model_name,
        "ollama_url": os.getenv('OLLAMA_URL', 'http://localhost:11434'),
        "openai_configured": bool(os.getenv('OPENAI_API_KEY')),
        "database_connected": db.pool is not None,
        "supabase_auth_configured": bool(os.getenv('SUPABASE_URL') and os.getenv('SUPABASE_ANON_KEY'))
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
