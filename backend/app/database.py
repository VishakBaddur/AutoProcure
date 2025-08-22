import os
import asyncpg
import json
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from .models import VendorQuote, QuoteItem, QuoteTerms, AnalysisResult

class Database:
    def __init__(self):
        self.database_url = os.getenv('DATABASE_URL')
        self.pool = None
        
    async def connect(self):
        """Create database connection pool"""
        if not self.database_url:
            print("⚠️  No DATABASE_URL configured, using in-memory storage")
            return
            
        try:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=1,
                max_size=10,
                statement_cache_size=0  # Fix for PGBouncer/transaction pooler
            )
            print("✅ Database connected successfully")
            
            # Create tables if they don't exist
            await self.create_tables()
            
        except Exception as e:
            print(f"❌ Database connection failed: {str(e)}")
            print("⚠️  Falling back to in-memory storage")
    
    async def create_tables(self):
        """Create database tables"""
        if not self.pool:
            return
            
        async with self.pool.acquire() as conn:
            # Users table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(255),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
            # Waitlist table for email collection
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS waitlist (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    status VARCHAR(50) DEFAULT 'pending'
                )
            """)
            
            # Quotes table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS quotes (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id),
                    filename VARCHAR(255) NOT NULL,
                    file_type VARCHAR(10) NOT NULL,
                    vendor_name VARCHAR(255),
                    total_cost DECIMAL(15,2),
                    delivery_time VARCHAR(100),
                    payment_terms VARCHAR(255),
                    warranty VARCHAR(255),
                    ai_recommendation TEXT,
                    raw_text TEXT,
                    analysis_result JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
            # Quote items table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS quote_items (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
                    sku VARCHAR(255),
                    description TEXT,
                    quantity INTEGER,
                    unit_price DECIMAL(10,2),
                    delivery_time VARCHAR(100),
                    total DECIMAL(15,2),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
            # Create indexes for better performance
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
                CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);
                CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
                CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
            """)
            
            print("✅ Database tables created successfully")
    
    async def save_quote_analysis(self, 
                                 filename: str, 
                                 file_type: str, 
                                 raw_text: str,
                                 analysis_result: AnalysisResult,
                                 user_id: Optional[str] = None) -> str:
        """Save quote analysis to database"""
        if not self.pool:
            print("⚠️  No database connection, skipping save")
            return "mock_quote_id"
        
        try:
            async with self.pool.acquire() as conn:
                # Extract data from analysis result
                quote = analysis_result.quotes[0] if analysis_result.quotes else None
                
                if not quote:
                    raise ValueError("No quote data in analysis result")
                
                # Insert quote record
                quote_id = await conn.fetchval("""
                    INSERT INTO quotes (
                        user_id, filename, file_type, vendor_name, total_cost,
                        delivery_time, payment_terms, warranty, ai_recommendation,
                        raw_text, analysis_result
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    RETURNING id
                """, 
                user_id, filename, file_type, quote.vendorName,
                sum(item.total for item in quote.items),
                quote.items[0].deliveryTime if quote.items else None,
                quote.terms.payment, quote.terms.warranty,
                analysis_result.recommendation, raw_text,
                json.dumps(analysis_result.dict())
                )
                
                # Insert quote items
                for item in quote.items:
                    await conn.execute("""
                        INSERT INTO quote_items (
                            quote_id, sku, description, quantity, unit_price,
                            delivery_time, total
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    """,
                    quote_id, item.sku, item.description, item.quantity,
                    item.unitPrice, item.deliveryTime, item.total
                    )
                
                print(f"✅ Quote saved to database with ID: {quote_id}")
                return str(quote_id)
                
        except Exception as e:
            print(f"❌ Failed to save quote to database: {str(e)}")
            return "mock_quote_id"
    
    async def get_quote_history(self, user_id: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Get quote history for a user, showing only the latest analysis per unique file name"""
        if not self.pool:
            return []
        
        try:
            async with self.pool.acquire() as conn:
                if user_id:
                    rows = await conn.fetch("""
                        SELECT DISTINCT ON (filename)
                            id, filename, file_type, vendor_name, total_cost, 
                            delivery_time, ai_recommendation, created_at
                        FROM quotes 
                        WHERE user_id = $1
                        ORDER BY filename, created_at DESC
                        LIMIT $2
                    """, user_id, limit)
                else:
                    rows = await conn.fetch("""
                        SELECT DISTINCT ON (filename)
                            id, filename, file_type, vendor_name, total_cost, 
                            delivery_time, ai_recommendation, created_at
                        FROM quotes 
                        ORDER BY filename, created_at DESC
                        LIMIT $1
                    """, limit)
                
                return [dict(row) for row in rows]
                
        except Exception as e:
            print(f"❌ Failed to get quote history: {str(e)}")
            return []
    
    async def get_quote_by_id(self, quote_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed quote by ID"""
        if not self.pool:
            return None
        
        try:
            async with self.pool.acquire() as conn:
                # Get quote details
                quote_row = await conn.fetchrow("""
                    SELECT * FROM quotes WHERE id = $1
                """, quote_id)
                
                if not quote_row:
                    return None
                
                # Get quote items
                items_rows = await conn.fetch("""
                    SELECT * FROM quote_items WHERE quote_id = $1
                """, quote_id)
                
                quote_data = dict(quote_row)
                quote_data['items'] = [dict(item) for item in items_rows]
                
                return quote_data
                
        except Exception as e:
            print(f"❌ Failed to get quote by ID: {str(e)}")
            return None
    
    async def get_analytics(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Get analytics data for unique files (latest per filename)"""
        if not self.pool:
            return {"total_quotes": 0, "total_value": 0, "avg_quote_value": 0, "avg_delivery_time": "N/A"}
        
        try:
            async with self.pool.acquire() as conn:
                if user_id:
                    rows = await conn.fetch("""
                        SELECT DISTINCT ON (filename)
                            total_cost, delivery_time
                        FROM quotes
                        WHERE user_id = $1
                        ORDER BY filename, created_at DESC
                    """, user_id)
                else:
                    rows = await conn.fetch("""
                        SELECT DISTINCT ON (filename)
                            total_cost, delivery_time
                        FROM quotes
                        ORDER BY filename, created_at DESC
                    """)
                total_quotes = len(rows)
                total_value = sum(float(row["total_cost"] or 0) for row in rows)
                avg_value = total_value / total_quotes if total_quotes else 0
                return {
                    "total_quotes": total_quotes,
                    "total_value": total_value,
                    "avg_quote_value": avg_value,
                    "avg_delivery_time": "N/A"  # Placeholder
                }
        except Exception as e:
            print(f"❌ Failed to get analytics: {str(e)}")
            return {"total_quotes": 0, "total_value": 0, "avg_quote_value": 0, "avg_delivery_time": "N/A"}

    async def get_relevant_past_quotes(self, user_id: str, skus: list, limit: int = 5) -> list:
        """Retrieve the most recent N past quotes for the same SKUs for RAG."""
        if not self.pool or not skus:
            return []
        try:
            async with self.pool.acquire() as conn:
                # Flatten SKUs for SQL IN clause
                sku_tuple = tuple(skus)
                rows = await conn.fetch(
                    f"""
                    SELECT q.id, q.filename, q.vendor_name, q.total_cost, q.created_at, qi.sku, qi.description, qi.unit_price, qi.quantity, qi.total
                    FROM quotes q
                    JOIN quote_items qi ON q.id = qi.quote_id
                    WHERE q.user_id = $1 AND qi.sku = ANY($2::varchar[])
                    ORDER BY q.created_at DESC
                    LIMIT $3
                    """,
                    user_id, sku_tuple, limit
                )
                return [dict(row) for row in rows]
        except Exception as e:
            print(f"❌ Failed to get relevant past quotes for RAG: {str(e)}")
            return []

    async def add_to_waitlist(self, email: str) -> Dict[str, Any]:
        """Add email to waitlist"""
        if not self.pool:
            return {"success": False, "message": "Database not connected"}
        
        try:
            async with self.pool.acquire() as conn:
                # Check if email already exists
                existing = await conn.fetchrow("""
                    SELECT id FROM waitlist WHERE email = $1
                """, email)
                
                if existing:
                    return {"success": False, "message": "Email already registered"}
                
                # Add to waitlist
                waitlist_id = await conn.fetchval("""
                    INSERT INTO waitlist (email) VALUES ($1) RETURNING id
                """, email)
                
                print(f"✅ Email added to waitlist: {email}")
                return {"success": True, "message": "Successfully joined waitlist", "id": str(waitlist_id)}
                
        except Exception as e:
            print(f"❌ Failed to add email to waitlist: {str(e)}")
            return {"success": False, "message": "Failed to join waitlist"}

    async def get_waitlist_count(self) -> int:
        """Get total number of waitlist subscribers"""
        if not self.pool:
            return 0
        
        try:
            async with self.pool.acquire() as conn:
                count = await conn.fetchval("""
                    SELECT COUNT(*) FROM waitlist
                """)
                return count or 0
        except Exception as e:
            print(f"❌ Failed to get waitlist count: {str(e)}")
            return 0

# Global database instance
db = Database() 