from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models.vendor import Base
import os

# Database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./autoprocure.db")

# Create SQLAlchemy engine
if DATABASE_URL.startswith("postgresql"):
    # For PostgreSQL (production)
    engine = create_engine(DATABASE_URL)
else:
    # For SQLite (development)
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_tables():
    """Create all database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        raise

def get_sqlalchemy_db():
    """Get SQLAlchemy database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()