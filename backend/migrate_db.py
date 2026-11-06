"""
Database Migration Script
Adds missing columns to the users table for Google Calendar integration
"""
import sqlite3
import os

DB_PATH = "arogyamitra.db"

def migrate_database():
    """Add missing columns to users table"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if columns exist
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    migrations = []
    
    # Add Google Calendar columns if they don't exist
    if 'google_calendar_token' not in columns:
        migrations.append("ALTER TABLE users ADD COLUMN google_calendar_token TEXT")
    
    if 'google_calendar_refresh_token' not in columns:
        migrations.append("ALTER TABLE users ADD COLUMN google_calendar_refresh_token TEXT")
    
    if 'google_calendar_expiry' not in columns:
        migrations.append("ALTER TABLE users ADD COLUMN google_calendar_expiry DATETIME")
    
    # Execute migrations
    for migration in migrations:
        try:
            cursor.execute(migration)
            print(f"✅ Executed: {migration}")
        except sqlite3.OperationalError as e:
            print(f"⚠️ Skipped (already exists): {migration}")
    
    conn.commit()
    conn.close()
    
    if migrations:
        print(f"\n✅ Database migration completed! Added {len(migrations)} columns.")
    else:
        print("\n✅ Database is up to date. No migrations needed.")

if __name__ == "__main__":
    print("🔄 Starting database migration...\n")
    migrate_database()
