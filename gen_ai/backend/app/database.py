from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./arogyamitra.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # needed for SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    from app.models.user import User, WorkoutPlan, NutritionPlan, HealthAssessment, ProgressRecord, ChatSession
    Base.metadata.create_all(bind=engine)
    # Lightweight migration: add columns that might be missing from older DBs
    _migrate_columns()
    print("✅ Database tables created successfully")

def _migrate_columns():
    """Add new columns to existing tables if they don't exist yet."""
    import sqlite3
    db_path = DATABASE_URL.replace("sqlite:///", "")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        # Check if body_fat_percentage column exists in progress_records
        cursor.execute("PRAGMA table_info(progress_records)")
        columns = [col[1] for col in cursor.fetchall()]
        if "body_fat_percentage" not in columns:
            cursor.execute("ALTER TABLE progress_records ADD COLUMN body_fat_percentage REAL")
            print("✅ Migration: added body_fat_percentage to progress_records")
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"⚠️ Migration check: {e}")