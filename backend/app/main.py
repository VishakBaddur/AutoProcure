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
from .models import QuoteItem, QuoteTerms, VendorQuote, AnalysisResult, MultiVendorAnalysis
from .slack import send_slack_alert
from .ai_processor import ai_processor
from .multi_vendor_analyzer import multi_vendor_analyzer
from .database import db
from .pdf_processor import enhanced_pdf_processor
from .excel_processor import enhanced_excel_processor

app = FastAPI(title="AutoProcure API", version="1.0.0")

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://auto-procure.vercel.app",
        "https://autoprocure-ai.vercel.app",
        "https://autoprocure-procurement.vercel.app",
        "https://autoprocure-frontend.onrender.com",
        "https://autoprocure.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Remove authentication dependencies for beta
# Remove: from .auth import auth_manager
# Remove: security = HTTPBearer()
# Remove: get_current_user function
# Remove: SignupRequest, LoginRequest, /auth/signup, /auth/login, /auth/me endpoints
# Remove: current_user and Depends(get_current_user) from all endpoints

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF using enhanced processor with OCR fallback"""
    try:
        # Use enhanced PDF processor
        result = enhanced_pdf_processor.extract_text_enhanced(file_content)
        
        # Log extraction method used
        print(f"[PDF EXTRACTION] Method: {result['extraction_method']}, OCR used: {result['ocr_used']}")
        print(f"[PDF EXTRACTION] Tables found: {len(result['tables'])}")
        
        # If tables were found, add them to the text for better analysis
        if result['tables']:
            table_text = "\n\n=== EXTRACTED TABLES ===\n"
            for i, table in enumerate(result['tables']):
                table_text += f"\nTable {i+1} (Method: {table['method']}, Accuracy: {table['accuracy']}%):\n"
                if table['headers']:
                    table_text += " | ".join(str(h) for h in table['headers']) + "\n"
                    table_text += "-" * 50 + "\n"
                for row in table['data'][:5]:  # Limit to first 5 rows
                    table_text += " | ".join(str(v) for v in row.values()) + "\n"
            result['text'] += table_text
        
        return result['text']
    except Exception as e:
        print(f"[PDF EXTRACTION ERROR] {str(e)}")
        # Fallback to original method
        try:
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                text = ""
                for page_num, page in enumerate(pdf.pages):
                    page_text = page.extract_text() or ""
                    print(f"=== Extracted PDF Page {page_num+1} Text ===")
                    print(page_text)
                    text += page_text
                return text
        except Exception as fallback_error:
            raise HTTPException(status_code=400, detail=f"PDF parsing error: {str(fallback_error)}")

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

# Remove get_current_user and all auth endpoints
# Remove current_user from upload_file, analyze_multiple_quotes, get_quote_history, get_quote, get_analytics

# For endpoints that used current_user, set user_id, user_email, user_name to None
# For quote history and analytics, return all data (or empty if not available)

@app.get("/")
async def root():
    return {"message": "AutoProcure API is running!"}

@app.post("/upload", response_model=AnalysisResult)
async def upload_file(
    file: UploadFile = File(...),
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
        # Extract text or structured data based on file type
        if file_extension == 'pdf':
            text_content = extract_text_from_pdf(file_content)
            quote = await ai_processor.analyze_quote(text_content)
        else:
            # Try structured Excel parse first
            structured_quote = enhanced_excel_processor.parse(file_content, filename=file.filename)
            if structured_quote and structured_quote.items:
                quote = structured_quote
            else:
                # Fallback to text extraction + NLP
                text_content = extract_text_from_excel(file_content)
                quote = await ai_processor.analyze_quote(text_content)
        # --- RAG: Retrieve relevant past quotes for context ---
        user_id = None # Set user_id to None for public endpoints
        # For RAG, we need SKUs. We'll extract them after AI analysis, so for the first run, just analyze as usual.
        initial_quote = quote
        skus = [item.sku for item in initial_quote.items]
        rag_context = ""
        if user_id and skus:
            past_quotes = await db.get_relevant_past_quotes(user_id, skus, limit=5)
            if past_quotes:
                rag_context = "\n".join([
                    f"Date: {q['created_at']}, Vendor: {q['vendor_name']}, SKU: {q['sku']}, Desc: {q['description']}, Qty: {q['quantity']}, Unit: {q['unit_price']}, Total: {q['total']}" for q in past_quotes
                ])
        # If initial analysis was text-based, re-run with RAG context where applicable
        if not isinstance(quote, VendorQuote) or not quote.items:
            quote = await ai_processor.analyze_quote(text_content, rag_context=rag_context)
        
        # Debug output
        print(f"[DEBUG] Quote analysis result:")
        print(f"  Vendor: {quote.vendorName}")
        print(f"  Items count: {len(quote.items)}")
        print(f"  First item: {quote.items[0].description if quote.items else 'No items'}")
        
        # Create comparison and recommendation
        total_cost = sum(item.total for item in quote.items)
        delivery_time = quote.items[0].deliveryTime if quote.items else "N/A"
        comparison = {
            "totalCost": total_cost,
            "deliveryTime": delivery_time,
            "vendorCount": 1
        }
        # Generate smart recommendation based on actual analysis
        if quote.vendorName == "Analysis Failed - Manual Review Required" or quote.vendorName == "Analysis Failed":
            recommendation = "AI analysis failed. Please manually review the uploaded document."
        elif quote.vendorName.startswith("Document Type:"):
            # Handle non-quote documents
            doc_type = quote.vendorName.replace("Document Type: ", "")
            recommendation = f"This appears to be a {doc_type.lower()}, not a vendor quote. Please upload a vendor quote with itemized pricing for analysis."
        elif not quote.items or len(quote.items) == 0:
            recommendation = "No items or pricing information could be extracted from the document. Please verify the document contains quote details."
        elif quote.vendorName == "Unknown Vendor":
            if total_cost > 0:
                recommendation = f"Quote analyzed successfully with total value: ${total_cost:,.2f}. Vendor name could not be extracted from the document."
            else:
                recommendation = "Quote analyzed but no pricing information could be extracted. Please verify the document format."
        else:
            # Only use actual vendor name and data from the analysis
            recommendation = f"Vendor {quote.vendorName} quote analyzed successfully."
            
            # Add pricing information only if we have actual data
            if total_cost > 0:
                recommendation += f" Total quote value: ${total_cost:,.2f}."
                
                # Add delivery information only if we have it
                if delivery_time and delivery_time != "TBD":
                    recommendation += f" Delivery time: {delivery_time}."
                
                # Add value-based insights only if we have real data
                if total_cost > 10000:
                    recommendation += " This appears to be a high-value quote."
                elif total_cost > 1000:
                    recommendation += " This appears to be a medium-value quote."
                else:
                    recommendation += " This appears to be a low-value quote."
            else:
                recommendation += " No pricing information could be extracted from the document."
        result = AnalysisResult(
            quotes=[quote],
            comparison=comparison,
            recommendation=recommendation
        )
        # Save to database with user ID
        user_email = None # Set user_email to None for public endpoints
        user_name = None # Set user_name to None for public endpoints
        print(f"[UPLOAD] user_id={user_id}, email={user_email}, name={user_name}")
        # Defensive: ensure user exists in users table
        # await auth_manager._create_user_record(user_id, user_email, user_name) # Removed auth_manager call
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

@app.post("/analyze-multiple", response_model=AnalysisResult)
async def analyze_multiple_quotes(
    files: List[UploadFile] = File(...),
):
    """Analyze multiple vendor quotes and provide intelligent multi-vendor recommendations"""
    if not files or len(files) < 2:
        raise HTTPException(status_code=400, detail="At least 2 vendor quotes required for comparison")
    
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 vendor quotes allowed for analysis")
    
    try:
        quotes = []
        file_contents = []
        
        # Process each file
        for file in files:
            if not file.filename:
                continue
                
            file_extension = file.filename.lower().split('.')[-1]
            if file_extension not in ['pdf', 'xlsx', 'xls']:
                continue
            
            # Read and extract text
            file_content = await file.read()
            if file_extension == 'pdf':
                text_content = extract_text_from_pdf(file_content)
                parsed_quote = await ai_processor.analyze_quote(text_content)
            else:
                # Structured Excel first
                structured_quote = enhanced_excel_processor.parse(file_content, filename=file.filename)
                if structured_quote and structured_quote.items:
                    parsed_quote = structured_quote
                    text_content = "\n".join([f"{it.quantity} x {it.description} @ {it.unitPrice}" for it in structured_quote.items])
                else:
                    text_content = extract_text_from_excel(file_content)
                    parsed_quote = await ai_processor.analyze_quote(text_content)
            
            # Analyze quote
            quote = parsed_quote
            quotes.append(quote)
            file_contents.append({
                "filename": file.filename,
                "content": text_content
            })
        
        if len(quotes) < 2:
            raise HTTPException(status_code=400, detail="Could not analyze enough quotes for comparison")
        
        # Get RAG context for multi-vendor analysis
        user_id = None # Set user_id to None for public endpoints
        rag_context = ""
        if user_id:
            # Get SKUs from all quotes
            all_skus = []
            for quote in quotes:
                all_skus.extend([item.sku for item in quote.items])
            
            if all_skus:
                past_quotes = await db.get_relevant_past_quotes(user_id, all_skus, limit=10)
                if past_quotes:
                    rag_context = "\n".join([
                        f"Date: {q['created_at']}, Vendor: {q['vendor_name']}, SKU: {q['sku']}, Desc: {q['description']}, Qty: {q['quantity']}, Unit: {q['unit_price']}, Total: {q['total']}" for q in past_quotes
                    ])
        
        # Perform multi-vendor analysis
        multi_vendor_result = await multi_vendor_analyzer.analyze_multiple_quotes(quotes, rag_context)

        # Suggestion/Conclusion logic
        def suggest_best_vendor(quotes):
            # Build a map of best price for each item across vendors
            item_best = {}
            for quote in quotes:
                for item in quote.items:
                    key = item.description.strip().lower()
                    if key not in item_best or item.unitPrice < item_best[key]['unitPrice']:
                        item_best[key] = {
                            'vendor': quote.vendorName,
                            'unitPrice': item.unitPrice,
                            'total': item.total,
                            'quantity': item.quantity
                        }
            split_total = sum(x['unitPrice'] * x['quantity'] for x in item_best.values())
            vendor_totals = {}
            for quote in quotes:
                vendor_totals[quote.vendorName] = sum(item.total for item in quote.items)
            best_vendor = min(vendor_totals, key=vendor_totals.get)
            best_vendor_total = vendor_totals[best_vendor]
            savings = best_vendor_total - split_total
            if savings > best_vendor_total * 0.05:
                return f"Split the order: buy each item from the vendor offering the lowest price. This saves ${savings:.2f} compared to buying everything from {best_vendor}."
            else:
                return f"Buy everything from {best_vendor} for simplicity. Total cost: ${best_vendor_total:.2f}."

        suggestion = suggest_best_vendor(quotes)
        
        # Create analysis result
        total_cost = sum(
            sum(item.total for item in quote.items) 
            for quote in quotes
        )
        
        comparison = {
            "totalCost": total_cost,
            "vendorCount": len(quotes),
            "costSavings": multi_vendor_result.cost_savings,
            "riskAssessment": multi_vendor_result.risk_assessment
        }
        
        result = AnalysisResult(
            quotes=quotes,
            comparison=comparison,
            recommendation=multi_vendor_result.recommendation,
            multi_vendor_analysis=multi_vendor_result
        )
        
        # Save to database
        user_email = None # Set user_email to None for public endpoints
        user_name = None # Set user_name to None for public endpoints
        
        # await auth_manager._create_user_record(user_id, user_email, user_name) # Removed auth_manager call
        
        # Save each quote separately for history
        quote_ids = []
        for i, file_content in enumerate(file_contents):
            quote_id = await db.save_quote_analysis(
                filename=file_content["filename"],
                file_type="multi_vendor",
                raw_text=file_content["content"],
                analysis_result=result,
                user_id=user_id
            )
            quote_ids.append(quote_id)
        
        # Add quote IDs and suggestion to response
        result_dict = result.dict()
        result_dict["quote_ids"] = quote_ids
        result_dict["suggestion"] = suggestion
        
        # Send Slack alert
        await send_slack_alert(result)
        
        return result_dict
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multi-vendor analysis failed: {str(e)}")

@app.get("/quotes")
async def get_quote_history(
    limit: int = 10,
):
    """Get quote history for current user"""
    try:
        user_id = None # Set user_id to None for public endpoints
        quotes = await db.get_quote_history(user_id=user_id, limit=limit)
        return {"quotes": quotes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get quote history: {str(e)}")

@app.get("/quotes/{quote_id}")
async def get_quote(
    quote_id: str,
):
    """Get specific quote by ID"""
    try:
        quote = await db.get_quote_by_id(quote_id)
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")
        
        # Check if user owns this quote (if authenticated)
        # if current_user and quote.get("user_id") and quote["user_id"] != current_user["user_id"]: # Removed auth check
        #     raise HTTPException(status_code=403, detail="Access denied")
            
        return quote
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get quote: {str(e)}")

@app.get("/analytics")
async def get_analytics(
):
    """Get analytics data for current user"""
    try:
        user_id = None # Set user_id to None for public endpoints
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
    
    # Test Ollama if it's the provider
    ollama_working = False
    if ai_provider == 'ollama':
        try:
            # Simple test prompt
            test_prompt = "Say 'Hello World'"
            response = await ai_processor._call_ollama(test_prompt)
            ollama_working = len(response.strip()) > 0
        except Exception as e:
            print(f"Ollama test failed: {str(e)}")
            ollama_working = False
    
    return {
        "ai_provider": ai_provider,
        "model_name": model_name,
        "ollama_url": os.getenv('OLLAMA_URL', 'http://localhost:11434'),
        "ollama_working": ollama_working,
        "openai_configured": bool(os.getenv('OPENAI_API_KEY')),
        "database_connected": db.pool is not None,
        "supabase_auth_configured": bool(os.getenv('SUPABASE_URL') and os.getenv('SUPABASE_ANON_KEY'))
    }

@app.get("/test-nlp")
async def test_nlp():
    """Test NLP analysis with sample quote text"""
    try:
        sample_text = """
        Quote from ABC Supplies Inc.
        
        ITEMS:
        10 x Laptop Computers @ $899.99
        5 x Monitors @ $299.99
        
        Payment: Net 30
        Warranty: 1 year standard warranty
        """
        
        # Create a simple prompt
        prompt = f"QUOTE TEXT:\n{sample_text}"
        
        # Test the NLP analysis
        result = ai_processor._analyze_quote_with_nlp(prompt)
        
        return {
            "status": "success",
            "sample_text": sample_text,
            "analysis_result": result,
            "parsed_result": json.loads(result)
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
