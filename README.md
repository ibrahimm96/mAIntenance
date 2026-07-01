# mAIntenance

mAIntenance is a lightweight full-stack web app for tracking vehicle maintenance, forecasting upcoming services, estimating 12-month maintenance costs, and generating AI-powered vehicle-specific maintenance recommendations.

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
- OpenAI-compatible Python SDK

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

Edit `.env` with local values. At minimum, set a non-default `JWT_SECRET_KEY`. AI recommendations require `OPENAI_API_KEY`.

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
- `OPENAI_API_KEY`: required for AI recommendation generation
- `OPENAI_BASE_URL`: optional OpenAI-compatible API base URL
- `OPENAI_MODEL`: defaults to `gpt-4o-mini`

Frontend variable:
- `VITE_API_URL`: backend API origin, usually `http://localhost:5001`

Do not commit `.env`.

## What Is Done

Implemented backend:
- Flask app factory and health endpoint
- SQLAlchemy models for users, vehicles, service records, maintenance rules, AI recommendation sets, and AI recommendation items
- Bcrypt password hashing
- JWT registration, login, and `/auth/me`
- Vehicle CRUD with ownership checks
- Service record create, update, list, and delete with ownership checks
- Default maintenance rule seeding
- Backend-only forecast engine
- 12-month maintenance cost timeline
- Most expensive month detection
- Approved AI recommendation items included in forecast totals
- AI recommendation generation through the backend only
- Friendly error handling for missing AI configuration and malformed AI responses
- Backend tests for auth, ownership, forecast basics, and AI configuration failure

Implemented frontend:
- Landing page
- Register and login pages
- Auth persistence after refresh through localStorage JWT
- Protected dashboard shell using the Google Stitch-inspired layout
- Vehicle garage page with add, edit, and delete
- Vehicle overview page with summary cards, forecast chart, upcoming maintenance, and AI recommendations
- Vehicle history tab/page at `/vehicles/:vehicleId/history`
- Service history add, edit, and delete workflow
- AI recommendation approval/rejection controls
- Responsive dashboard-style cards, tables, badges, and empty states

## AI Recommendation Behavior

The original chat-box concept was replaced with structured AI-powered maintenance recommendations.

Current behavior:
- Recommendations are generated from the Flask backend.
- The API key is never exposed to the frontend.
- Recommendations are saved per vehicle.
- Manual regeneration replaces the previous recommendation set.
- Each recommendation starts as pending.
- Only approved AI recommendations affect the 12-month forecast totals.
- Rejected or pending recommendations remain visible but do not affect forecast totals.
- AI output is treated as educational guidance, not a diagnosis.

Displayed disclaimer:

```text
AI recommendations are educational and may be inaccurate. They are not a confirmed diagnosis.
```

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
- Backend tests: `5 passed`
- Frontend build: passed

## What Still Needs To Be Done

Recommended next work:
- Add vehicle editing directly on the vehicle overview page.
- Improve AI response schema validation and recovery for partial model output.
- Add clearer labels separating rule-based forecast items from AI-approved forecast items.
- Add frontend tests for auth, vehicle CRUD, history CRUD, and recommendation approval.
- Expand backend tests for service update/delete and AI item forecast inclusion.
- Add production deployment setup, including a WSGI entrypoint and deployment checklist.
- Improve mobile navigation; the current shell is desktop-first and hides the sidebar on small screens.
- Replace SQLAlchemy legacy `Query.get()` calls with `db.session.get()` to remove deprecation warnings.

## Notes

- The app is intentionally scoped to maintenance tracking and forecasting.
- It does not include payments, social features, mechanic booking, image diagnosis, or live vehicle telemetry.
- Forecast calculations live on the backend.
- Secrets must stay server-side.
