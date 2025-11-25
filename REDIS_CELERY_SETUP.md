# How to Run Redis and Celery on Windows

## Option 1: Without Redis/Celery (Quick Start)
The app works fine without Redis and Celery. Only the background export feature won't work.

**Just restart your Flask app:**
```powershell
cd "c:\Users\sachi\Downloads\Vehicle parking system"
python app.py
```

The vehicle number and email validation features will work perfectly!

---

## Option 2: With Redis and Celery (Full Features)

### Step 1: Install Redis for Windows

**Method A: Using Chocolatey (Easiest)**
```powershell
# Install Chocolatey first (if not installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Then install Redis
choco install redis-64 -y
```

**Method B: Manual Install**
1. Download from: https://github.com/microsoftarchive/redis/releases
2. Download: `Redis-x64-3.0.504.msi`
3. Run installer
4. Redis will run as a Windows Service automatically

**Method C: Using WSL (Windows Subsystem for Linux)**
```powershell
# In WSL terminal
sudo apt-get update
sudo apt-get install redis-server
redis-server
```

### Step 2: Start Redis

**If installed as Windows Service:**
```powershell
# Check if running
Get-Service -Name Redis*

# Start if not running
Start-Service Redis
```

**If manual installation:**
```powershell
# Navigate to Redis folder (usually C:\Program Files\Redis)
cd "C:\Program Files\Redis"
redis-server.exe
```

**Verify Redis is running:**
```powershell
redis-cli ping
# Should return: PONG
```

### Step 3: Install Celery Python Package

```powershell
cd "c:\Users\sachi\Downloads\Vehicle parking system"
pip install celery redis
```

### Step 4: Run Everything

**Terminal 1: Redis (if not running as service)**
```powershell
redis-server
```

**Terminal 2: Flask App**
```powershell
cd "c:\Users\sachi\Downloads\Vehicle parking system"
python app.py
```

**Terminal 3: Celery Worker**
```powershell
cd "c:\Users\sachi\Downloads\Vehicle parking system"
celery -A app.celery worker --loglevel=info --pool=solo
```

**Terminal 4: Celery Beat (Optional - for scheduled tasks)**
```powershell
cd "c:\Users\sachi\Downloads\Vehicle parking system"
celery -A app.celery beat --loglevel=info
```

---

## Troubleshooting

### "redis-cli not recognized"
**Solution**: Redis is not installed or not in PATH. Try Method A or B above.

### "Cannot connect to Redis"
**Solution**: 
1. Check if Redis service is running: `Get-Service Redis*`
2. Try starting it: `Start-Service Redis`
3. Or run manually: `redis-server.exe`

### Celery worker fails on Windows
**Solution**: Always use `--pool=solo` flag on Windows:
```powershell
celery -A app.celery worker --loglevel=info --pool=solo
```

### "No module named celery"
**Solution**: Install it:
```powershell
pip install celery redis
```

---

## Quick Test

### Test without Redis/Celery:
1. Restart Flask: `python app.py`
2. Register with Gmail: `test@gmail.com` ✅
3. Book with vehicle number: `AB12CD3456` ✅
4. Export feature won't work ❌

### Test with Redis/Celery:
1. Start Redis
2. Start Flask
3. Start Celery worker
4. Try export feature - should work! ✅

---

## What Features Need Redis/Celery?

### Works WITHOUT Redis/Celery:
- ✅ User registration and login
- ✅ Gmail email validation
- ✅ Vehicle number validation (XXNNXXNNNN)
- ✅ Booking parking spots
- ✅ Viewing history
- ✅ Admin operations
- ✅ All charts and statistics
- ✅ Caching (falls back to simple dictionary cache)

### Needs Redis/Celery:
- ❌ CSV Export generation (will fail without Celery)
- ❌ Scheduled daily reminders
- ❌ Scheduled monthly reports

---

## Recommendation

**For testing the new features (vehicle number + Gmail validation):**
- You don't need Redis or Celery!
- Just restart Flask app after running the database fix

**For production or if you need exports:**
- Install Redis using Method A (Chocolatey) - easiest
- Run Celery worker in a separate terminal

---

## Current Status Check

Run this to verify everything:
```powershell
# Check Flask is running
curl http://localhost:5000

# Check Redis (if installed)
redis-cli ping

# Check database fix worked
python -c "import sqlite3; conn = sqlite3.connect('backend/parking.db'); cursor = conn.cursor(); cursor.execute('PRAGMA table_info(reservations)'); print([col[1] for col in cursor.fetchall()])"
```

Should see `vehicle_number` in the column list!
