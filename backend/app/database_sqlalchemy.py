from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models.vendor import Base
import os

# Database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./autoprocure.db")

# Create SQLAlchemy engine with connection pooling and error handling
try:
    if DATABASE_URL.startswith("postgresql"):
        # For PostgreSQL (production) - add connection pooling and timeout settings
        engine = create_engine(
            DATABASE_URL,
            pool_size=5,
            max_overflow=10,
            pool_timeout=30,
            pool_recycle=3600,
            connect_args={
                "connect_timeout": 10,
                "application_name": "autoprocure"
            }
        )
        print("✅ PostgreSQL engine created")
    else:
        # For SQLite (development)
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
        print("✅ SQLite engine created")
    
    # Test the connection
    with engine.connect() as conn:
        conn.execute("SELECT 1")
    print("✅ Database connection test successful")
    
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    print("⚠️  Falling back to SQLite for development")
    # Fallback to SQLite if PostgreSQL fails
    engine = create_engine("sqlite:///./autoprocure.db", connect_args={"check_same_thread": False})

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_tables():
    """Create all database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        print("⚠️  Continuing without database tables - app will use in-memory storage")
        # Don't raise the exception - let the app continue without database

def get_sqlalchemy_db():
    """Get SQLAlchemy database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()