"""
Quick fix to add vehicle_number column to existing database.
"""
import sqlite3
import os

DB_PATH = "backend/parking.db"

def fix_database():
    """Add vehicle_number column if missing."""
    if not os.path.exists(DB_PATH):
        print("No database found. It will be created on next run.")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check current schema
        cursor.execute("PRAGMA table_info(reservations)")
        columns = [col[1] for col in cursor.fetchall()]
        print(f"Current columns: {columns}")
        
        if 'vehicle_number' in columns:
            print("✓ vehicle_number column already exists!")
        else:
            print("Adding vehicle_number column...")
            cursor.execute("ALTER TABLE reservations ADD COLUMN vehicle_number TEXT DEFAULT 'UNKNOWN000'")
            conn.commit()
            print("✓ Successfully added vehicle_number column!")
            print("  Old reservations will have 'UNKNOWN000' as vehicle number.")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 50)
    print("Database Fix Script")
    print("=" * 50)
    fix_database()
    print("=" * 50)
    print("Done! Now restart your Flask app.")
