# Vehicle Parking App V2

Full-stack parking management system built with a Flask API, Vue.js frontend, Redis-backed caching, and Celery background processing. The solution supports separate admin and user experiences, end-to-end reservation workflows, and milestone-based project tracking for MAD2.

---

## Contents

1. [Project Overview](#project-overview)
2. [Key Capabilities](#key-capabilities)
3. [System Architecture](#system-architecture)
4. [Setup & Installation](#setup--installation)
5. [Running the Application](#running-the-application)
6. [Default Accounts](#default-accounts)
7. [Milestone Progress Tracker](#milestone-progress-tracker)
8. [API Surface](#api-surface)
9. [Troubleshooting & Maintenance](#troubleshooting--maintenance)
10. [Repository Hygiene](#repository-hygiene)
11. [References & Helpful Links](#references--helpful-links)

---

## Project Overview

The Vehicle Parking App helps administrators manage parking lots and individual spots while enabling users to reserve, occupy, and release spots. Business rules such as automatic spot allocation, cost calculation, and reservation history are enforced server-side. Redis caching and Celery jobs keep the experience responsive even as usage grows.

### Roles

| Role  | Capabilities |
|-------|--------------|
| Admin | Create/modify lots, auto-generate spots, inspect usage analytics, review users, trigger CSV exports |
| User  | Self-register, view availability, reserve first free spot, mark occupancy, release, download reservation history |

---

## Key Capabilities

### Authentication & RBAC
- Session-based login using **Flask-Login**
- Pre-seeded admin account, self-service user registration
- Role-aware API routing (admin vs. user blueprints)

### Administrative Tools
- Configurable parking lots with automatic spot creation
- Dashboard metrics (total lots/spots, occupancy summaries)
- Full user list with reservation snapshots
- CSV export management via Celery tasks

### User Workflow
- Live lot availability with pricing
- One-click reservation picks the earliest free spot
- Occupy/release flow captures timestamps and computes fees
- Reservation history and CSV export for audit trail

### Background Processing
- **Daily reminders** for inactive users (Celery beat @18:00 IST)
- **Monthly usage reports** (HTML) generated on the 1st
- **On-demand CSV exports** served asynchronously via polling

### Caching Strategy
- Redis-backed caching for hot endpoints (lots, dashboard stats)
- Automatic invalidation when data mutates

---

## System Architecture

```
Vehicle parking system/
├─ app.py                  # Entry point exposing Flask app & Celery instance
├─ backend/
│  ├─ app.py               # Application factory, Celery wiring, blueprint registration
│  ├─ cache_keys.py        # Canonical cache key definitions
│  ├─ extensions.py        # Cache & login manager singletons
│  ├─ models/              # SQLite data access helpers
│  └─ routes/              # Auth, admin, and user blueprints
├─ frontend/
│  ├─ index.html           # Bootstrap shell mounting the SPA
│  └─ src/
│     ├─ main.js           # Vue bootstrap & role layout logic
│     ├─ api.js            # Fetch wrappers for backend REST endpoints
│     └─ components/       # Admin/User/Auth view components
├─ requirements.txt        # Python dependencies
├─ exports/                # Generated CSVs (runtime)
├─ notifications/          # Daily reminder logs (runtime)
└─ reports/                # Monthly report HTML files (runtime)
```

### Technology Stack
- **Backend:** Flask 2.3, Flask-Login, Flask-Caching, Celery 5, Redis, SQLite
- **Frontend:** Vue 3 (CDN), Bootstrap 5, vanilla ES modules
- **Infrastructure:** Redis for caching & broker, Celery worker + beat for async jobs

---

## Setup & Installation

### Prerequisites
- Python ≥ 3.8
- Redis server (Windows users can leverage Redis on WSL or the official installer)
- Node tooling is not required because the Vue app ships pre-bundled

### Install Dependencies

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

## Running the Application

Open separate terminals for the following processes (after activating the virtual environment in each shell):

1. **Redis**
   ```powershell
   redis-server
   ```

2. **Celery worker**
   ```powershell
   celery -A app.celery worker --loglevel=info
   ```

3. **Celery beat (scheduled jobs)**
   ```powershell
   celery -A app.celery beat --loglevel=info
   ```

4. **Flask development server**
   ```powershell
   flask --app app run
   ```

5. Visit the SPA at **http://localhost:5000**.

> The Vue app is served directly from Flask; no frontend build step is required.

---

## Default Accounts

- **Admin:** `admin` / `admin123`
- **Users:** self-register via the `/api/auth/register` endpoint or the UI registration panel

---

## Milestone Progress Tracker

| Milestone | Status | Commit Message | Notes |
|-----------|--------|----------------|-------|
| Milestone 0 – Repository Setup | ✅ Completed | `Milestone-0 VP-MAD2` | Repo scaffolding, README, prerequisites |
| Milestone – Database Models & Schema | ⏳ In Progress | `Milestone-VP-MAD2 DB-Relationship` | Models for users, lots, spots, reservations, export jobs |
| Milestone – Authentication & RBAC | ⏳ In Progress | `Milestone-VP-MAD2 Auth-RBAC-Token` | Session management, role routing, dashboards |
| Milestone – Admin Dashboard & Management | ⏳ In Progress | `Milestone-VP-MAD2 Admin-Dashboard-Management` | Lot CRUD, spot auto-generation, analytics |
| Milestone – User Dashboard & Reservations | ⏳ In Progress | `Milestone-VP-MAD2 User-Dashboard-Management` | Reservation flow, timestamps, history |
| Milestone – Reservation History & Costing | ⏳ In Progress | `Milestone-VP-MAD2 Reservation-Cost-Calculation` | Fee computation and reporting |
| Milestone – Analytics & Charts | ⏳ In Progress | `Milestone-VP-MAD2 Charts-Analytics` | Chart.js/Matplotlib integration |
| Milestone – Redis Caching & Optimization | ⏳ In Progress | `Milestone-VP-MAD2 Redis-Caching` | Cache policies, invalidation |
| Milestone – Celery Jobs & Automation | ⏳ In Progress | `Milestone-VP-MAD2 Celery-Jobs` | Reminders, reports, CSV exports |
| Recommended Enhancements | Optional | `Milestone-VP-MAD2 Search-Admin`, etc. | Search, PWA, advanced analytics |
| Final Submission | Pending | `Milestone-VP-MAD2 Final-Submission` | Zip, report, demo video, AI usage declaration |

> Keep commit messages aligned with the milestone naming convention for easier evaluation and tracking.

---

## API Surface

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/profile`

### Admin
- `GET /api/admin/lots`
- `POST /api/admin/lots`
- `PATCH /api/admin/lots/<id>`
- `DELETE /api/admin/lots/<id>`
- `GET /api/admin/users`
- `GET /api/admin/dashboard`

### User
- `GET /api/user/lots`
- `GET /api/user/reservations`
- `POST /api/user/reservations`
- `POST /api/user/reservations/<id>/release`
- `POST /api/user/exports`
- `GET /api/user/exports`
- `GET /api/user/exports/<id>/download`

---

## Troubleshooting & Maintenance

| Issue | Diagnostic Command | Resolution |
|-------|--------------------|------------|
| Redis connection failure | `redis-cli ping` | Ensure Redis server is running; restart service if needed |
| Celery tasks not executing | `celery -A app.celery inspect active` | Verify worker and beat processes are running |
| Scheduled jobs missing | `celery -A app.celery inspect scheduled` | Restart Celery beat and confirm timezone config |
| Flask port already in use | `flask --app app run --port 5001` | Launch on an alternate port |
| Reset environment | Delete `parking.db` and rerun `flask --app app run` | Seeds admin account and recreates schema |

---

## Repository Hygiene

- **.gitignore:** configure to skip compiled assets, virtual environments, and runtime exports when necessary.
- **Collaborator Tracking:** add `MADII-cs2006` as a collaborator via GitHub settings as mandated by the milestone tracker.
- **Branching:** use feature branches per milestone (`milestone/<name>`) before merging into `main`.
- **Commit Names:** follow the provided milestone naming templates to keep grading simple.

---

## References & Helpful Links

- [GitHub – Adding Collaborators (video walkthrough)](https://www.youtube.com/watch?v=qjJ8aoYxCo8) *(per tracker recommendation)*
- [Celery Documentation](https://docs.celeryq.dev/en/stable/)
- [Redis Quick Start](https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/)
- [Flask User Session Management](https://flask-login.readthedocs.io/en/latest/)
- [Vue.js Guide](https://vuejs.org/guide/introduction.html)

---

> Code remains intentionally readable with clear separation between backend, frontend, and worker responsibilities to support quick iteration and viva demonstrations.
