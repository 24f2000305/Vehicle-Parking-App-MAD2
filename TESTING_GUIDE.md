# Quick Test Guide

## Testing All New Features

### Prerequisites
1. Start Flask app: `python app.py`
2. For exports: Start Redis and Celery worker (see FEATURE_UPDATES.md)

---

## Test 1: Gmail Email Validation ✅

### Steps:
1. Open http://localhost:5000
2. Click "Sign Up" or switch to registration mode
3. Fill in:
   - Username: `testuser`
   - Email: `testuser@yahoo.com` ❌
   - Password: `test123`
4. Click "Sign Up"
5. **Expected**: Error message "email must be a valid Gmail address"
6. Change email to: `testuser@gmail.com` ✅
7. Click "Sign Up"
8. **Expected**: Success message "Account created successfully!"

---

## Test 2: Vehicle Number Validation ✅

### Steps:
1. Login with your test account
2. Navigate to "Book Parking Spot" tab
3. Select any parking lot
4. **Test Invalid Formats:**
   
   a) Leave vehicle number empty
   - Click "Book Spot"
   - **Expected**: Warning "Vehicle number must be in format XXNNXXNNNN"
   
   b) Enter `ABC123` (too short)
   - Click "Book Spot"
   - **Expected**: Same validation error
   
   c) Enter `1234567890` (all numbers)
   - Click "Book Spot"
   - **Expected**: Same validation error
   
   d) Enter `ABCDEFGHIJ` (all letters)
   - Click "Book Spot"
   - **Expected**: Same validation error

5. **Test Valid Format:**
   - Enter `AB12CD3456` ✅
   - Select quantity: 2
   - Click "Book Spot"
   - **Expected**: Success message "Successfully booked 2 spot(s)!"

---

## Test 3: Vehicle Number Display ✅

### User Views:
1. Go to "Active Reservations" tab
   - **Expected**: See vehicle number badge (🚗 AB12CD3456) next to spot number

2. Go to "Booking History" tab
   - **Expected**: Active reservations show vehicle number
   - **Expected**: Completed reservations table has "Vehicle" column

### Admin Views:
1. Login as admin (need to manually set role='A' in database)
2. Navigate to "Reservations" tab
3. **Expected**: Table has "Vehicle" column showing all vehicle numbers

---

## Test 4: Admin Lot Management ✅

### Test Edit:
1. Login as admin
2. Go to "Parking Lots" tab
3. Click "Edit" button on any lot
4. Change name to: "Updated Lot Name"
5. Change price to: 150
6. Click "Save Changes"
7. **Expected**: Success message "Parking lot updated successfully"
8. **Expected**: Lot list refreshes with new name and price

### Test Delete:
1. Create a new lot first:
   - Click "+ Add New Lot"
   - Fill all fields
   - Click "Save"
2. Try to delete a lot with active reservations:
   - Click "Delete" on lot with active bookings
   - Confirm deletion
   - **Expected**: Error "cannot delete lot with occupied spots"
3. Try to delete empty lot:
   - Click "Delete" on empty lot
   - Confirm deletion
   - **Expected**: Success "Lot deleted successfully"

---

## Test 5: Caching Performance ✅

### Test Cache Hit:
1. User view: Go to "Book Parking Spot"
2. Open browser DevTools > Network tab
3. Note the response time for `/api/user/lots`
4. Refresh the page (or switch tabs and come back)
5. Check Network tab again
6. **Expected**: Second request should be faster (served from cache)
7. **Cache expires after 120 seconds** - wait and test again

### Test Cache Invalidation:
1. Admin view: Create a new parking lot
2. User view: Refresh "Book Parking Spot" page
3. **Expected**: New lot appears immediately (cache was busted)

---

## Test 6: Background Export (Requires Celery)

### Setup:
```powershell
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Celery worker
cd "c:\Users\sachi\Downloads\Vehicle parking system"
celery -A app.celery worker --loglevel=info --pool=solo
```

### Test:
1. User view: Go to "Export History" tab
2. Click "Generate New Export"
3. **Expected**: Alert "Export job started. It will appear here when ready."
4. Watch Celery worker terminal for processing logs
5. Wait 5-10 seconds
6. Click "Refresh" button
7. **Expected**: Export appears with "Completed" status and download link
8. Click "Download CSV"
9. **Expected**: CSV file downloads with reservation data

---

## Test 7: Password Visibility Toggle ✅

### Steps:
1. Go to login page
2. Enter password: `test123`
3. **Expected**: Password is hidden (••••••)
4. Click eye icon (👁️) button
5. **Expected**: Password becomes visible (test123)
6. Click eye icon again
7. **Expected**: Password hidden again (••••••)

---

## Test 8: Multiple Spot Booking ✅

### Steps:
1. User view: "Book Parking Spot"
2. Select a lot with at least 5 available spots
3. Enter vehicle number: `XY98ZW4567`
4. Set quantity to 1
5. Click + button to increment to 5
6. **Expected**: Quantity shows 5
7. Click - button to decrement to 3
8. **Expected**: Quantity shows 3
9. Click "Book Spot"
10. **Expected**: Success "Successfully booked 3 spot(s)!"
11. Go to "Active Reservations"
12. **Expected**: 3 separate reservations listed (all with same vehicle number)

---

## Test 9: Price Calculation ✅

### Steps:
1. Book a spot (any vehicle number)
2. Note the parking lot's price per hour (e.g., ₹100/hr)
3. Wait 5 seconds (or longer)
4. Click "Release Spot"
5. **Expected**: Success message with cost
6. Go to "Booking History"
7. Check the "Cost" column
8. **Expected**: Minimum ₹100 (minimum 1 hour charge even if parked for seconds)

---

## Test 10: Charts Visibility ✅

### User Charts:
1. Go to "Statistics & Insights" tab
2. **Expected**: 
   - Doughnut chart showing completed vs active bookings
   - Line chart showing bookings and spending trends over time
3. **Expected**: No blank canvas, charts render within 100ms

### Admin Charts:
1. Login as admin
2. Go to "Dashboard" tab
3. **Expected**:
   - Bar chart showing parking spot statistics
   - Line chart showing reservations per day
4. **Expected**: All charts visible and interactive

---

## Common Issues

### Issue: "Cannot find module 'redis'"
**Solution**: `pip install redis celery flask-caching`

### Issue: Charts not rendering
**Solution**: Hard refresh (Ctrl+Shift+R) to clear browser cache

### Issue: Vehicle number doesn't save
**Solution**: Run migration script: `python migrate_add_vehicle_number.py`

### Issue: Admin operations fail
**Solution**: Ensure user has role='A' in database:
```sql
UPDATE users SET role='A' WHERE username='admin';
```

### Issue: Export stays in "Pending" status
**Solution**: 
1. Check Redis is running: `redis-cli ping` (should return PONG)
2. Check Celery worker is running and processing tasks
3. Check worker logs for errors

---

## Success Criteria

All tests passing means:
- ✅ Gmail-only email validation working
- ✅ Vehicle number validation (XXNNXXNNNN format)
- ✅ Vehicle numbers stored and displayed
- ✅ Admin can edit/delete parking lots
- ✅ Caching improves performance
- ✅ Background exports work (if Celery running)
- ✅ All charts render properly
- ✅ Multiple spot booking works
- ✅ Price calculation accurate

---

**Next Steps**: Configure email for scheduled reminders (see FEATURE_UPDATES.md)
