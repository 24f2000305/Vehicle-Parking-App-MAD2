# Viva Quick Reference Guide

## Pre-Viva Setup (5 minutes)

### 1. Start Services
```powershell
# Terminal 1 - Redis
redis-server

# Terminal 2 - Celery Worker
celery -A app.celery worker --loglevel=info

# Terminal 3 - Celery Beat
celery -A app.celery beat --loglevel=info

# Terminal 4 - Flask
flask --app app run
```

### 2. Quick Test Data Setup
1. Open http://localhost:5000
2. Login: `admin` / `admin123`
3. Create 2-3 parking lots (different prices)
4. Logout, register as user: `testuser` / `pass123`
5. Book 1-2 spots
6. Release 1 spot

## Rubric Quick Answers

### Q1: Can you run the app in 10 minutes?
**Answer:** Yes sir. Main bas 4 terminals mein commands run karunga - Redis, Celery worker, Celery beat, aur Flask app. 5 minutes mein ready ho jayega.

### Q2: Authentication and RBAC?
**Answer:** Ji sir, main Flask-Login use kiya hai for session-based authentication. Do roles hain - admin aur user. Har route mein `require_admin()` ya `require_user()` check karta hoon. Admin database create hone par automatically add ho jata hai.

### Q3: Tech stack allowed?
**Answer:** Ji sir:
- Flask for backend APIs
- VueJS 3 via CDN for frontend
- Bootstrap 5 for styling
- SQLite for database
- Redis for caching and Celery broker
- Celery for background jobs

### Q4: APIs created?
**Answer:** Ji sir, REST APIs banaye hain:
- Auth APIs: register, login, logout, profile
- Admin APIs: lots CRUD, users list, dashboard
- User APIs: lots browse, booking, release, exports

### Q5: Admin can create lot?
**Answer:** Ji sir, admin panel mein form hai. Name, price per hour, total spots required hain. Address aur PIN optional hain. Submit karne par lot create hota hai aur automatically spots generate hote hain.

**Code:** `backend/routes/admin.py` line 44 - `lots_create()` function

### Q6: Admin can modify spot count?
**Answer:** Ji sir, lot update mein total_spots modify kar sakte hain. Agar increase karenge toh new spots create honge status 'A' ke saath. Decrease karne par available spots delete honge. Agar occupied spots hain toh error aayega.

**Code:** `backend/models/lots.py` line 61 - `update_lot()` function

### Q7: Admin can delete empty lot?
**Answer:** Ji sir, har lot ke saath delete button hai. Backend mein check karta hoon ki koi occupied spot toh nahi. Agar sab spots available hain tabhi delete hoga.

**Code:** `backend/routes/admin.py` line 95 - `lots_delete()` function

### Q8: User can book spot?
**Answer:** Ji sir, user lot select karta hai dropdown se aur Reserve Spot button click karta hai. Backend automatically first available spot assign karta hai. Status 'A' se 'O' ho jata hai.

**Code:** `backend/models/reservations.py` line 11 - `create_reservation()` function

### Q9: User can select lot of choice?
**Answer:** Ji sir, dropdown mein sab available lots with free spot count dikhayi deti hain. User apni choice ki lot select kar sakta hai price dekh kar.

**Code:** `frontend/src/components/UserPanel.js` line 122

### Q10: User can occupy spot?
**Answer:** Ji sir, book button click karne par reservation create hota hai. Spot ka status 'O' ho jata hai aur timestamp record hota hai automatically.

**Code:** Same as Q8

### Q11: User can release spot?
**Answer:** Ji sir, har active reservation ke saath Release button hai. Click karne par left_at timestamp set hota hai, cost calculate hota hai duration ke basis par, aur spot status wapas 'A' ho jata hai.

**Code:** `backend/models/reservations.py` line 41 - `release_reservation()` function

### Q12: Admin can view spot status?
**Answer:** Ji sir, admin dashboard mein total spots aur occupied spots count dikhta hai. Har lot ke saath available/total ratio bhi hai.

**Code:** `backend/models/lots.py` line 139 - `admin_dashboard_stats()` function

### Q13: Admin can view parked vehicle details?
**Answer:** Ji sir, backend mein reservations table hai jisme sab details stored hain - user_id, spot_id, timestamps. Admin users list bhi dekh sakta hai.

**Partial:** UI mein detailed view nahi hai but backend support hai

### Q14: Admin can view registered users?
**Answer:** Ji sir, admin panel mein Registered Users table hai niche. Username, email, registration date dikhta hai.

**Code:** `backend/routes/admin.py` line 110 - `list_users()` function

### Q15: Admin summary charts?
**Answer:** Ji sir, dashboard stats dikhate hain - total lots, total spots, occupied count. Visual charts nahi hain but data hai.

**Can Improve:** ChartJS add kar sakte hain quickly

### Q16: Timestamp for cost calculation?
**Answer:** Ji sir, parked_at timestamp automatic set hota hai booking time. Release time par left_at set hota hai. Dono ka difference hours mein calculate karke price_per_hour se multiply karta hoon. Minimum 1 hour charge.

**Code:** `backend/models/reservations.py` line 62-64

### Q17: User summary charts?
**Answer:** Ji sir, user reservations list mein sab history with costs dikhti hai. Visual chart nahi hai but complete data hai.

**Code:** `frontend/src/components/UserPanel.js` line 135

### Q18: Admin auto-created?
**Answer:** Ji sir, database initialize karte waqt `ensure_admin()` function check karta hai. Agar admin nahi hai toh automatically create kar deta hai. Credentials: username=`admin`, password=`admin123`.

**Code:** `backend/models/db.py` line 84 - `ensure_admin()` function

### Q19: Celery scheduled jobs?
**Answer:** Ji sir, do scheduled jobs hain:

**Daily Reminders:**
- Time: 18:00 daily
- Kaam: Users jo 24 hours mein park nahi kiye unhe reminder
- Output: `notifications/` folder mein log files

**Monthly Reports:**
- Time: 1st of month, 18:10
- Kaam: User ka parking history HTML report
- Output: `reports/` folder mein HTML files

**Code:** `backend/tasks.py` line 75 - `send_daily_reminders()`, line 95 - `send_monthly_reports()`

### Q20: User-triggered export?
**Answer:** Ji sir, user dashboard mein "Request CSV Export" button hai. Click karne par Celery task queue mein jata hai. Status har 5 seconds poll hota hai. Complete hone par download link dikhayi deta hai. CSV mein reservation details hain.

**Code:** `backend/tasks.py` line 50 - `run_export_job()`

### Q21: Redis caching with expiry?
**Answer:** Ji sir, teen cache keys use kiye hain:
- Admin lots: 300 seconds timeout
- Admin dashboard: 300 seconds
- User lots: 120 seconds

Data change hone par cache bust karta hoon.

**Code:** `backend/cache_keys.py`, all routes use `cache.get()` and `cache.set()`

### Q22-24: Descriptive Questions
**Prepare:**
- Database schema explain kar sakta hoon with relationships
- API architecture REST principles
- Vue component structure
- Celery task flow
- Flask-Login session management

## Common Live Modifications

### Add a new field to lot:
```python
# backend/models/lots.py - add in create_lot and list_all_lots
# backend/routes/admin.py - add in payload
# frontend - add input field in form
```

### Change cache timeout:
```python
# backend/routes/admin.py line 33
cache.set(cache_keys.ADMIN_LOTS_CACHE_KEY, lots, timeout=600)  # 10 minutes
```

### Add validation:
```python
# backend/routes/admin.py - add in lots_create
if total_spots > 100:
    return {"error": "Max 100 spots allowed"}, 400
```

## File Structure Quick Reference

```
backend/
├── app.py              # Flask app factory, Celery config
├── extensions.py       # Flask-Login, Cache instances
├── cache_keys.py       # Cache key constants
├── tasks.py            # Celery background tasks
├── models/
│   ├── db.py          # Database schema, connection
│   ├── users.py       # User model, auth functions
│   ├── lots.py        # Parking lot CRUD
│   ├── reservations.py # Booking logic
│   └── export_jobs.py  # Export job tracking
└── routes/
    ├── auth.py         # Login/register/logout
    ├── admin.py        # Admin endpoints
    └── user.py         # User endpoints

frontend/
├── index.html          # Bootstrap shell
└── src/
    ├── main.js         # Vue app root
    ├── api.js          # Fetch wrappers
    └── components/
        ├── AuthPane.js    # Login/register forms
        ├── AdminPanel.js  # Admin dashboard
        └── UserPanel.js   # User dashboard
```

## Important Functions to Remember

### Authentication:
- `verify_credentials()` - Password check
- `@login_required` - Route decorator
- `require_admin()` - Role check

### Booking Flow:
1. User selects lot
2. `create_reservation()` finds first available spot
3. Updates spot status to 'O'
4. Records timestamp
5. Returns reservation with lot details

### Release Flow:
1. User clicks release
2. `release_reservation()` calculates duration
3. Computes cost = hours * price_per_hour
4. Updates left_at timestamp
5. Changes spot status back to 'A'

### Cache Strategy:
1. Try cache first: `cache.get(key)`
2. If miss, fetch from DB
3. Store in cache: `cache.set(key, data, timeout)`
4. On update: `cache.delete(key)` - bust cache

### Export Flow:
1. User requests export
2. Job created with status 'queued'
3. Celery task picks up
4. Status → 'processing'
5. CSV generated
6. Status → 'completed' with file_path
7. Frontend polls every 5s
8. Download link shows when complete

## Demo Flow for Viva

1. **Login as Admin**
   - Show admin dashboard stats
   - Create new lot
   - Show registered users list

2. **Create Test Lots**
   - Mall Parking - Rs 50/hr - 10 spots
   - Airport Parking - Rs 100/hr - 5 spots

3. **Register as User**
   - Logout admin
   - Register: testuser / test123
   - Login as testuser

4. **Book Spot**
   - Select Mall Parking
   - Book spot
   - Show reservation in list

5. **Release Spot**
   - Click release on booking
   - Show cost calculation

6. **Export Demo**
   - Click "Request CSV Export"
   - Wait for status to change
   - Download CSV

7. **Show Caching**
   - Open browser DevTools → Network
   - Refresh lots - show response time
   - Refresh again - show cached (faster)

8. **Show Background Jobs**
   - Open `notifications/` folder
   - Show reminder logs
   - Open `reports/` folder
   - Show monthly HTML report

## Confidence Boosters

**Main points jo confidently bol sakta hoon:**

1. "Sir, main database schema khud design kiya hai. Four main tables hain with proper foreign keys."

2. "Sir, authentication session-based hai Flask-Login se. Token-based nahi kyunki requirement mein session/token dono allowed the."

3. "Sir, spot allocation automatic hai - first available spot milta hai user ko. Manual selection nahi hai as per requirement."

4. "Sir, caching strategically lagaya hai - frequently accessed data par like lots list aur dashboard stats."

5. "Sir, sab comments hinglish first-person mein hain. Mereko code clearly samajh aa raha hai isliye viva mein bhi explain kar sakta hoon."

6. "Sir, test data quickly create kar sakta hoon. Admin already seeded hai, bas lots banane hain aur ek user register karna hai."

## Last-Minute Checks

- [ ] Redis running hai?
- [ ] Celery worker running hai?
- [ ] Celery beat running hai?
- [ ] Flask app running hai?
- [ ] Browser mein app load ho raha hai?
- [ ] Admin login work kar raha hai?
- [ ] User registration work kar raha hai?
- [ ] Exports folder exist karta hai?
- [ ] Reports folder exist karta hai?
- [ ] Notifications folder exist karta hai?

## Emergency Fixes

**If Redis not connecting:**
```powershell
redis-cli ping
# Should return PONG
```

**If Celery tasks not running:**
```powershell
celery -A app.celery inspect active
# Should show worker is alive
```

**If database needs reset:**
```powershell
rm parking.db
flask --app app run
# Admin will be auto-created
```

**If port 5000 busy:**
```powershell
flask --app app run --port 5001
```

## Final Tip

Sir ke question ka answer dene se pehle:
1. Deep breath lo
2. Code location yaad karo
3. Function name bol do
4. Flow explain karo step-by-step
5. Agar live modification bole toh confidently file open karo

All the best!
