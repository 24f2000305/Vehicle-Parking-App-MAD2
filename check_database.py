import sqlite3

conn = sqlite3.connect('backend/parking.db')
cursor = conn.cursor()

# Check schema
cursor.execute('PRAGMA table_info(reservations)')
print("✓ Reservations table columns:")
for col in cursor.fetchall():
    print(f"  - {col[1]} ({col[2]})")

# Check existing data
cursor.execute('SELECT id, vehicle_number FROM reservations LIMIT 5')
rows = cursor.fetchall()

print(f"\n✓ Existing reservations: {len(rows)} found")
if rows:
    for row in rows:
        print(f"  - ID {row[0]}: Vehicle {row[1]}")
else:
    print("  (No reservations yet)")

conn.close()
print("\n✅ Database is ready! Restart Flask app now.")
