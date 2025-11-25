# Vehicle Parking System - Setup Instructions

## Running the Application

### 1. Start the Flask Server
```bash
python app.py
```
The application will run on http://127.0.0.1:5000

### 2. Start Celery Worker (Required for Export Feature)
The export feature requires a Celery worker to process background jobs. 

**Option 1: Using Redis (Recommended)**
```bash
# Install Redis if not already installed
# Windows: Download from https://github.com/microsoftarchive/redis/releases

# Start Redis server (in a separate terminal)
redis-server

# Start Celery worker (in another terminal)
celery -A app.celery worker --loglevel=info --pool=solo
```

**Option 2: Without Redis (Development Only)**
If you don't have Redis, you can modify the Celery configuration to use an alternative broker, but Redis is recommended for production.

### 3. Start Celery Beat (Optional - For Scheduled Tasks)
If you want automated daily reminders and monthly reports:
```bash
celery -A app.celery beat --loglevel=info
```

## Features Overview

### Admin Features
- **Dashboard**: View statistics with bar and line charts showing parking utilization and reservation trends
- **Lot Management**: Create, edit, and delete parking lots
- **Reservations**: View all system reservations
- **Users**: View registered users

### User Features
- **Book Spot**: Reserve parking spots (supports booking multiple spots at once, up to 10)
- **Active Reservations**: View and release currently active parking spots
- **History**: View all past and completed reservations
- **Exports**: Request CSV exports of your reservation history (requires Celery worker)
- **Statistics**: View personal booking trends and spending analytics with charts

## Troubleshooting

### Exports Not Working
If exports are stuck in "pending" status:
1. Make sure Redis is running
2. Start the Celery worker as shown above
3. Check the terminal for any error messages

### Charts Not Visible
- Charts require data to display
- Admin charts need parking lots and reservations
- User charts need personal reservations
- Make sure Chart.js is loading (check browser console for errors)

### Username Already Exists
- Usernames must be unique across all users
- Choose a different username if you see this error during registration

## Technology Stack
- **Backend**: Flask 2.3.3, Python 3.11+
- **Database**: SQLite
- **Caching**: Redis 5.0.4
- **Background Jobs**: Celery 5.3.6
- **Frontend**: Vue.js 3 (CDN), Bootstrap 5.3.3, Chart.js 4.4.0
