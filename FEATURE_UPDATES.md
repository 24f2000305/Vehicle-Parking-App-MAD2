# Vehicle Parking System - Recent Updates

## New Features Implemented

### 1. Vehicle Number Validation ✅
**Format**: XXNNXXNNNN (2 letters, 2 digits, 2 letters, 4 digits)

**Backend Changes:**
- Added `vehicle_number` column to `reservations` table (TEXT, NOT NULL)
- Backend validation: `^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$` regex pattern
- Updated all reservation queries to include vehicle_number
- API now requires vehicle_number parameter in booking requests

**Frontend Changes:**
- Added vehicle number input field in booking form
- Automatic uppercase conversion
- Format validation before submission (XXNNXXNNNN pattern)
- Displays vehicle numbers in:
  - User booking history
  - Active reservations page
  - Admin reservations view
- Input has maxlength=10 and format hint

**Example**: AB12CD3456

---

### 2. Gmail-Only Email Validation ✅
**Format**: Must end with @gmail.com

**Backend Changes:**
- Registration endpoint validates email format
- Returns clear error: "email must be a valid Gmail address"
- Pattern check: `email.endswith("@gmail.com")`

**Frontend Changes:**
- Email input updated with:
  - Pattern attribute: `[a-zA-Z0-9._%+\-]+@gmail\.com$`
  - Placeholder: "yourname@gmail.com"
  - Help text: "Must be a valid Gmail address"
  - HTML5 validation before form submission

---

### 3. Admin Parking Lot Management ✅
**Features**: Create, Edit, Delete parking lots

**Current Status:**
- ✅ Backend PATCH endpoint at `/api/admin/lots/<lot_id>`
- ✅ Backend DELETE endpoint at `/api/admin/lots/<lot_id>`
- ✅ Frontend API client methods (updateLot, deleteLot)
- ✅ Edit button in AdminLots component
- ✅ Form toggles between create/edit mode
- ✅ Cache busting on all operations

**Known Limitations:**
- Delete only works when all spots in the lot are free (no active reservations)
- Admin must have admin role (role='A') to access these endpoints

---

### 4. Scheduled Jobs & Background Tasks 📋
**Status**: Partially implemented, needs email configuration

**Current Implementation:**
- ✅ Celery configured with Redis broker
- ✅ Tasks defined in `backend/tasks.py`:
  - `run_export_job` - CSV export generation
  - `send_daily_reminders` - Daily reminder emails
  - `send_monthly_reports` - Monthly usage reports
- ✅ Export jobs table for tracking async exports
- ✅ Celery beat schedule configured for periodic tasks

**What Works:**
- Background CSV export generation
- Task logging to files

**What Needs Configuration:**
- Email sending (SMTP server setup required)
- See "Email Configuration" section below

---

### 5. Caching System ✅
**Technology**: Redis-based caching with Flask-Caching

**Cached Endpoints:**
- User parking lots listing: 120 seconds TTL
- Admin parking lots listing: 300 seconds TTL  
- Admin dashboard statistics: 300 seconds TTL

**Cache Keys:**
```python
USER_LOTS = "user:parking-lots"
ADMIN_LOTS = "admin:parking-lots"
ADMIN_DASHBOARD = "admin:dashboard-stats"
```

**Cache Invalidation:**
- Automatic bust on lot creation/update/delete
- Automatic bust on reservation creation/release
- Manual refresh buttons available in UI

---

## Database Migration Required

### Adding vehicle_number Column

**Option 1: Run Migration Script (Recommended)**
```powershell
python migrate_add_vehicle_number.py
```

This script will:
- Check if the column already exists
- Add vehicle_number column if missing
- Set default value "UNKNOWN000" for existing records
- Safe to run multiple times

**Option 2: Manual Migration**
```sql
ALTER TABLE reservations ADD COLUMN vehicle_number TEXT DEFAULT 'UNKNOWN000';
```

**Option 3: Fresh Start**
- Delete `parking.db` file
- Restart the Flask app
- New schema will be created automatically with vehicle_number column

---

## Email Configuration (Required for Scheduled Jobs)

### Setup SMTP for Gmail

**1. Update `backend/app.py` configuration:**
```python
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'your-email@gmail.com'
app.config['MAIL_PASSWORD'] = 'your-app-password'  # Use App Password, not regular password
app.config['MAIL_DEFAULT_SENDER'] = 'your-email@gmail.com'
```

**2. Install Flask-Mail:**
```powershell
pip install flask-mail
```

**3. Initialize Flask-Mail in `backend/extensions.py`:**
```python
from flask_mail import Mail
mail = Mail()
```

**4. Update `backend/tasks.py` to use Flask-Mail:**
```python
from .extensions import mail
from flask_mail import Message

@celery_app.task
def send_daily_reminders():
    # Get users with active reservations
    # Send email using Flask-Mail
    pass
```

### Getting Gmail App Password
1. Enable 2-Step Verification on your Google Account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an app-specific password
4. Use this password in MAIL_PASSWORD config

---

## Running the Complete System

### 1. Start Redis Server
```powershell
# Install Redis for Windows from: https://github.com/microsoftarchive/redis/releases
redis-server
```

### 2. Start Flask Backend
```powershell
cd "c:\Users\sachi\Downloads\Vehicle parking system"
python app.py
```

### 3. Start Celery Worker (for background tasks)
```powershell
cd "c:\Users\sachi\Downloads\Vehicle parking system"
celery -A app.celery worker --loglevel=info --pool=solo
```

### 4. Start Celery Beat (for scheduled tasks)
```powershell
cd "c:\Users\sachi\Downloads\Vehicle parking system"
celery -A app.celery beat --loglevel=info
```

### 5. Access Application
Open browser: http://localhost:5000

---

## Testing the New Features

### Test Vehicle Number Validation
1. Register/login as user
2. Navigate to "Book Parking Spot"
3. Select a parking lot
4. Try invalid formats:
   - `ABC123` - Too short
   - `AB12CD345` - Missing 1 digit
   - `1234567890` - All numbers
   - `ABCDEFGHIJ` - All letters
5. Try valid format: `AB12CD3456` ✓

### Test Gmail Email Validation
1. Go to registration page
2. Try non-Gmail addresses:
   - `test@yahoo.com` - Should fail
   - `user@outlook.com` - Should fail
3. Try valid Gmail: `test@gmail.com` ✓

### Test Admin Lot Management
1. Login as admin (role='A')
2. Navigate to "Parking Lots"
3. Click "+ Add New Lot" or "Edit" on existing lot
4. Modify details and save
5. Try deleting a lot (only works if all spots are free)

### Test Background Export
1. Login as user
2. Go to "Export History"
3. Click "Generate New Export"
4. Check Celery worker logs for processing
5. Refresh page to see completed export

---

## API Changes Summary

### New Required Field: vehicle_number
**POST /api/user/reservations**
```json
{
  "lot_id": 1,
  "quantity": 2,
  "vehicle_number": "AB12CD3456"
}
```

### Gmail Validation
**POST /api/auth/register**
```json
{
  "username": "john",
  "password": "secure123",
  "email": "john@gmail.com"
}
```

### Admin Endpoints (No Changes)
- PATCH `/api/admin/lots/<id>` - Update lot
- DELETE `/api/admin/lots/<id>` - Delete lot (if no active reservations)

---

## Troubleshooting

### Issue: "vehicle number must be in format XXNNXXNNNN"
**Solution**: Ensure format is exactly 2 letters, 2 digits, 2 letters, 4 digits (e.g., AB12CD3456)

### Issue: "email must be a valid Gmail address"
**Solution**: Use only Gmail addresses ending in @gmail.com

### Issue: Old reservations show "UNKNOWN000" as vehicle number
**Solution**: This is expected for reservations created before the migration. New bookings will have real vehicle numbers.

### Issue: Export feature not working
**Solution**: 
1. Ensure Redis is running: `redis-server`
2. Start Celery worker: `celery -A app.celery worker --loglevel=info --pool=solo`
3. Check worker logs for errors

### Issue: Scheduled emails not sending
**Solution**:
1. Configure SMTP settings in `backend/app.py`
2. Install Flask-Mail: `pip install flask-mail`
3. Start Celery beat: `celery -A app.celery beat --loglevel=info`
4. Update tasks.py to use Flask-Mail

### Issue: Admin can't delete lot
**Solution**: 
- Check if lot has active reservations (spots with status='O')
- Only empty lots can be deleted
- Release all spots first, then try delete

### Issue: Cache not updating
**Solution**:
- Click refresh buttons in UI
- Cache auto-invalidates on create/update/delete operations
- Restart Flask app if cache is stuck

---

## Database Schema Changes

### reservations Table (Updated)
```sql
CREATE TABLE reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    spot_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    vehicle_number TEXT NOT NULL,          -- NEW FIELD
    parked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    left_at DATETIME,
    cost REAL DEFAULT 0,
    FOREIGN KEY (spot_id) REFERENCES parking_spots (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
)
```

---

## Performance Improvements

### Caching Benefits
- Reduced database queries for frequently accessed data
- Faster page loads for parking lot listings
- Dashboard statistics served from cache

### Background Jobs Benefits
- Non-blocking CSV export generation
- Users can continue using app while exports process
- Scheduled tasks run automatically without user intervention

---

## Security Considerations

### Email Validation
- Restricts to Gmail only (as requested)
- Prevents invalid email formats
- Client-side + server-side validation

### Vehicle Number Tracking
- Uppercase normalization prevents case mismatches
- Required field ensures data completeness
- Audit trail for parking spot usage

### Admin Operations
- Role-based access control (requires role='A')
- Confirmation prompts for destructive operations
- Cache invalidation prevents stale data

---

## Future Enhancements (Not Implemented)

1. **Vehicle Number History**: Track all vehicles per user
2. **Email Verification**: Send confirmation email on registration
3. **Multi-format Vehicle Numbers**: Support different regional formats
4. **Email Domain Whitelist**: Allow multiple email providers
5. **Soft Deletes**: Archive lots instead of permanent deletion
6. **Audit Logs**: Track all admin operations
7. **Rate Limiting**: Prevent abuse of API endpoints
8. **Real-time Notifications**: WebSocket updates for reservation status

---

## Support & Maintenance

### Log Files
- Flask app logs: Console output
- Celery worker logs: `celery.log`
- Daily reminders log: `daily_reminders.log`
- Monthly reports log: `monthly_reports.log`

### Monitoring
- Redis: Check with `redis-cli ping`
- Celery: Monitor worker output for task execution
- Flask: Check console for request logs

### Backup
- Database: Copy `parking.db` file
- Export files: Located in `exports/` directory
- Configuration: Backup `app.py` and `config.py`

---

**Last Updated**: 2024
**Version**: 2.0 with vehicle tracking and Gmail validation
