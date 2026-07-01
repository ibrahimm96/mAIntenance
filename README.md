# Maintenance Tracker

Maintenance Tracker is a lightweight full-stack web app for tracking vehicle maintenance, forecasting upcoming services, and estimating 12-month maintenance costs.

The app answers the core question:

> What maintenance is due next, when will it likely be due, and how much should I budget?

## Tech Stack

Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Recharts
- Lucide icons

Backend:
- Flask
- Flask-SQLAlchemy
- Flask-Bcrypt
- Flask-JWT-Extended
- Flask-CORS

Database:
- SQLite for local development
- PostgreSQL-compatible `DATABASE_URL` support for deployment

## Project Structure

```text
maintenance/
├── client/      # React frontend
├── server/      # Flask API
├── .env.example
├── .gitignore
└── README.md
```

## Local Setup

From the repository root:

```bash
cd maintenance
cp .env.example .env
```

Edit `.env` with local values. At minimum, set a non-default `JWT_SECRET_KEY`.

### Backend Setup

```bash
cd maintenance/server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

The API runs at:

```text
http://localhost:5001
```

Health check:

```bash
curl http://localhost:5001/api/health
```

Expected response:

```json
{
  "status": "ok"
}
```

### Frontend Setup

In a second terminal:

```bash
cd maintenance/client
npm install
npm run dev
```

The app runs at:

```text
http://localhost:5173
```

## Environment Variables

The example environment file is at `.env.example`.

Backend variables:
- `DATABASE_URL`: defaults to SQLite, for example `sqlite:///maintenance.db`
- `JWT_SECRET_KEY`: secret used to sign JWTs
- `PYTHON_VERSION`: set to `3.11.9` on Render

Frontend variable:
- `VITE_API_URL`: backend API origin, usually `http://localhost:5001`

Do not commit `.env`.

## What Is Done

Implemented backend:
- Flask app factory and health endpoint
- SQLAlchemy models for users, vehicles, service records, and maintenance rules
- Bcrypt password hashing
- JWT registration, login, and `/auth/me`
- Vehicle CRUD with ownership checks
- Service record create, update, list, and delete with ownership checks
- Default maintenance rule seeding
- Backend-only forecast engine
- 12-month maintenance cost timeline
- Most expensive month detection
- Backend tests for auth, ownership, and forecast basics

Implemented frontend:
- Landing page
- Register and login pages
- Auth persistence after refresh through localStorage JWT
- Protected dashboard shell
- Vehicle garage page with add, edit, and delete
- Vehicle overview page with summary cards, forecast chart, and upcoming maintenance
- Vehicle history tab/page at `/vehicles/:vehicleId/history`
- Service history add, edit, and delete workflow
- Responsive dashboard-style cards, tables, badges, and empty states

## Validation

Backend tests:

```bash
cd maintenance/server
.venv/bin/python -m pytest
```

Frontend build:

```bash
cd maintenance/client
npm run build
```

Last verified:
- Backend tests: pass
- Frontend build: pass

## What Still Needs To Be Done

Recommended next work:
- Add vehicle editing directly on the vehicle overview page.
- Add clearer explanations for rule-based forecast items.
- Add frontend tests for auth, vehicle CRUD, and history CRUD.
- Expand backend tests for service update/delete and cost timeline behavior.
- Add production deployment checklist.
- Improve mobile navigation; the current shell is compact but still desktop-oriented.
- Replace SQLAlchemy legacy `Query.get()` calls with `db.session.get()` to remove deprecation warnings.

## Notes

- The app is intentionally scoped to maintenance tracking and forecasting.
- It does not include payments, social features, mechanic booking, image diagnosis, or live vehicle telemetry.
- Forecast calculations live on the backend.
- Secrets must stay server-side.
