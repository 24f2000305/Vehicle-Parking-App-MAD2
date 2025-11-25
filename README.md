# Vehicle Parking App V2

## Overview
This is a Flask + Vue based parking management application for 4-wheeler parking management. The system has two roles:

- **Admin** - Manages parking lots and spots
- **User** - Books and releases spots (system automatically assigns first available spot)

Data is stored in SQLite, Redis is used for caching and Celery message brokering, and Bootstrap provides the UI styling.

## Key Features

### Authentication & Authorization
- Admin automatically created on first run (credentials: `admin`/`admin123`)
- User registration, login, logout using Flask-Login
- Session-based authentication with role-based access control (RBAC)

### Admin Features
- Create, edit, and delete parking lots
- Spots automatically generated when creating a lot
- Cannot delete lots with occupied spots (validation in place)
- Dashboard displays stats: total lots, total spots, occupied spots with visual charts
- View list of all registered users
- View detailed reservation information with active and completed bookings
- Real-time availability for each lot

### User Features
- Browse available lots with free spot count
- Automatic first-available spot assignment on booking
- Occupy and release spots
- Automatic cost calculation on release (duration × price_per_hour)
- Complete reservation history with timestamps and costs
- Visual charts showing parking statistics
- Request CSV export of parking details

### Caching
- Admin lots list cached (300 seconds)
- Admin dashboard stats cached (300 seconds)
- User lots list cached (120 seconds)
- Automatic cache invalidation on data changes

### Background Jobs
- **Daily Reminders**: Runs at 18:00 daily to remind users who haven't parked in 24 hours (logs in `notifications/`)
- **Monthly Reports**: Generates HTML report on 1st of each month with usage summary (saved in `reports/`)
- **CSV Export**: User-triggered async job to export reservation details to CSV (saved in `exports/`)

## Project Structure
```
Vehicle parking system/
├─ app.py                 # Thin runner exposing backend.app + backend.celery
├─ backend/
│  ├─ app.py              # Flask app factory + Celery wiring + blueprint registration
│  ├─ extensions.py       # Cache + login manager instances
│  ├─ cache_keys.py       # Centralized cache key constants
│  ├─ models/             # Raw SQL helpers (db, users, lots, reservations, export_jobs)
│  └─ routes/             # Modular blueprints (auth, admin, user)
├─ frontend/
│  ├─ index.html          # Bootstrap shell mounting the Vue app
│  └─ src/
│     ├─ main.js          # Vue application bootstrap + role-aware layout
│     ├─ api.js           # Fetch helpers targeting Flask APIs
│     └─ components/      # AuthPane, AdminPanel, UserPanel
├─ requirements.txt       # Python dependencies
├─ exports/               # Generated CSV exports (runtime)
├─ notifications/         # Daily reminder logs (runtime)
└─ reports/               # Monthly HTML reports (runtime)
```

## Getting Started

### Prerequisites
- Python 3.8 ya usse upar
- Redis server (Windows ke liye Redis installer ya WSL use karo)

### Installation Steps

1. **Virtual environment banao aur activate karo**
   ```powershell
   python -m venv venv
   venv\Scripts\activate
   ```

2. **Dependencies install karo**
   ```powershell
   pip install -r requirements.txt
   ```

3. **Redis server start karo** (alag terminal mein)
   ```powershell
   redis-server
   ```

4. **Celery worker start karo** (alag terminal mein)
   ```powershell
   celery -A app.celery worker --loglevel=info
   ```

5. **Celery beat start karo** (alag terminal mein - scheduled jobs ke liye)
   ```powershell
   celery -A app.celery beat --loglevel=info
   ```

6. **Flask app start karo** (alag terminal mein)
   ```powershell
   flask --app app run
   ```

7. **Browser mein kholo**: <http://localhost:5000>

   Vue SPA directly Flask se serve hota hai `frontend/` folder se, isliye koi build step nahi chahiye.

### Default Login Credentials
- **Admin**: username=`admin`, password=`admin123`
- **User**: Khud register karna padega

## Usage Flow

### Admin Workflow
1. Login karo admin credentials se (`admin`/`admin123`)
2. Dashboard mein stats dekho - lots, total spots, occupied count
3. "Create Lot" form bharo:
   - Name (required)
   - Price per hour (required)
   - Total spots (required)
   - Address (optional)
   - PIN code (optional)
4. Submit karne par lot create ho jayega aur spots automatically generate honge
5. Lots list mein available/total ratio dikhega
6. Delete button se empty lots delete kar sakte ho
7. Registered users list niche table mein dikhegi

### User Workflow
1. Register karo new account se
2. Login karne par available lots dropdown mein dikhenge
3. Lot select karo (price aur available spots dekh kar)
4. "Reserve Spot" click karo - automatically spot assign ho jayega
5. "My Reservations" mein apni bookings dikhegi
6. Active booking ke saath "Release" button hoga
7. Release karne par cost calculate ho jayega aur spot free ho jayega
8. "Request CSV Export" se apni sab bookings CSV mein download kar sakte ho

### Export Process
1. "Request CSV Export" button click karo
2. Job queue mein chala jayega
3. Status har 5 seconds update hota rahega
4. "completed" hone par download link dikhayi dega
5. CSV file `exports/` folder mein save hogi

## Database Schema

### Tables
1. **users**: User accounts with role (admin/user)
2. **parking_lots**: Lot details with price and capacity
3. **parking_spots**: Individual spots with status (A=Available, O=Occupied)
4. **reservations**: Booking records with timestamps and cost
5. **export_jobs**: CSV export job tracking

### Relationships
- Spots belong to lots (lot_id foreign key)
- Reservations link spots and users
- Automatic spot creation when lot is created
- Cascade delete on lot removal (only if empty)

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - New user registration
- `POST /api/auth/login` - User login (sets session)
- `POST /api/auth/logout` - User logout (clears session)
- `GET /api/auth/profile` - Get current logged-in user

### Admin Endpoints (requires admin role)
- `GET /api/admin/lots` - List all lots with availability
- `POST /api/admin/lots` - Create new parking lot
- `PATCH /api/admin/lots/<id>` - Update lot details/spots
- `DELETE /api/admin/lots/<id>` - Delete empty lot
- `GET /api/admin/users` - List all registered users
- `GET /api/admin/dashboard` - Get dashboard statistics

### User Endpoints (requires user role)
- `GET /api/user/lots` - List available lots
- `GET /api/user/reservations` - User's reservation history
- `POST /api/user/reservations` - Book a spot in selected lot
- `POST /api/user/reservations/<id>/release` - Release occupied spot
- `POST /api/user/exports` - Request CSV export job
- `GET /api/user/exports` - List user's export jobs
- `GET /api/user/exports/<id>/download` - Download completed export

## Technology Stack

### Backend
- **Flask 2.3.3**: Web framework for REST APIs
- **Flask-Login 0.6.3**: Session management and authentication
- **Flask-Caching 2.1.0**: Redis-backed caching
- **Celery 5.3.6**: Background task processing
- **Redis 5.0.4**: Cache and message broker
- **SQLite**: Database (auto-created as `parking.db`)

### Frontend
- **Vue 3**: Progressive JavaScript framework (via CDN)
- **Bootstrap 5**: CSS framework for responsive design
- **Vanilla JavaScript**: ES6 modules for API calls

## Important Notes

### Scheduled Jobs
- **Daily reminders**: 18:00 har din (Celery beat required)
- **Monthly reports**: 1st of month at 18:10 (Celery beat required)
- Logs `notifications/` aur `reports/` folders mein store hote hain

### Caching Strategy
- Frequently accessed data cached hai (lots, dashboard stats)
- Timeouts: 120-300 seconds
- Auto-bust on data modification
- Redis connection required

### Database
- `parking.db` automatically create hota hai first run par
- Admin user automatically seeded
- Delete database file to reset completely
- No migrations needed - raw SQL queries

### Code Style
- Hinglish first-person comments for clarity
- Simple structure - easy to modify in viva
- Raw SQL instead of ORM for transparency
- Modular routes - separate files for admin/user/auth

## Troubleshooting

### Redis connection error
```powershell
# Check if Redis running
redis-cli ping
# Should return PONG
```

### Celery tasks not executing
```powershell
# Check worker status
celery -A app.celery inspect active

# Check scheduled tasks
celery -A app.celery inspect scheduled
```

### Port already in use
```powershell
# Run on different port
flask --app app run --port 5001
```

### Reset database
```powershell
# Delete database and restart
rm parking.db
flask --app app run
# Admin will be auto-created again
```

## Project Structure Explanation

- `app.py`: Entry point - exposes Flask app and Celery instance
- `backend/app.py`: Flask application factory, Celery configuration, blueprints
- `backend/extensions.py`: Shared instances (cache, login_manager)
- `backend/cache_keys.py`: Centralized cache key constants
- `backend/tasks.py`: Celery task definitions (export, reminders, reports)
- `backend/models/`: Database operations and business logic
- `backend/routes/`: REST API endpoints organized by role
- `frontend/`: Vue SPA with Bootstrap styling
- `exports/`: Generated CSV files (created at runtime)
- `notifications/`: Daily reminder logs (created at runtime)
- `reports/`: Monthly HTML reports (created at runtime)

## For Viva Examiners

This project demonstrates:
1. **Session-based authentication** with Flask-Login
2. **Role-based access control** (admin/user)
3. **RESTful API design** with proper HTTP methods
4. **Caching strategy** with Redis and expiry
5. **Background job processing** with Celery
6. **Scheduled tasks** with Celery beat
7. **Database relationships** with foreign keys
8. **Frontend-backend separation** with Vue + Flask
9. **Responsive UI** with Bootstrap 5
10. **Async operations** with polling (export jobs)

Code is intentionally kept simple and readable for easy modification during viva demonstration.
#   V e h i c l e - P a r k i n g - A p p - M A D 2  
 