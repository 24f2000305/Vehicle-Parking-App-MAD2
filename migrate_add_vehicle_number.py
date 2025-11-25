"""
Migration script to add vehicle_number column to existing reservations table.
Run this script once to update your existing database.
"""

import sqlite3
import os

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), "parking.db")

def migrate():
    """Add vehicle_number column to reservations table if it doesn't exist."""
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        print("No migration needed - database will be created with new schema on first run.")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(reservations)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'vehicle_number' in columns:
            print("✓ vehicle_number column already exists. No migration needed.")
        else:
            # Add the column with default value for existing records
            print("Adding vehicle_number column to reservations table...")
            cursor.execute("""
                ALTER TABLE reservations 
                ADD COLUMN vehicle_number TEXT DEFAULT 'UNKNOWN000'
            """)
            conn.commit()
            print("✓ Successfully added vehicle_number column!")
            print("  Note: Existing reservations will have 'UNKNOWN000' as vehicle number.")
        
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Vehicle Number Migration Script")
    print("=" * 60)
    migrate()
    print("=" * 60)
    print("Migration complete!")
