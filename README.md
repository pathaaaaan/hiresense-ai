# HireSense AI

An AI-powered interview preparation platform: resume upload → ATS scoring →
(next) AI mock interviews → skill-gap roadmaps → progress dashboard.

## What's built in this slice

This repo currently implements **Auth + Resume Upload/ATS Scoring**, fully
working end to end, plus the folder architecture for the rest of the spec
(mock interviews, answer evaluation, skill-gap roadmap, dashboard) so those
flows can be added without restructuring anything.

**Working now:**
- Register / login with JWT auth (FastAPI + PostgreSQL)
- PDF resume upload → text extraction (PyMuPDF, falling back to pdfplumber)
- AI-based structured parsing (skills / education / projects / experience) via Gemini 2.5 Flash
- AI-based ATS scoring (score, missing skills, weaknesses, suggestions) via Gemini 2.5 Flash
- React + TypeScript + Tailwind frontend: landing page, auth pages, resume analysis page with a live ATS score gauge
- Runs fully without a Gemini key — a deterministic mock AI layer kicks in automatically (see "Running without an API key" below)

**Not built yet (scaffolded only):** interview question generation, mock
interview sessions, answer evaluation, skill-gap analyzer, roadmaps, and the
full analytics dashboard. See "Extending this" below for how to add them
using the same pattern.

## Project structure

```
backend/
  app/
    api/          # FastAPI routers (auth, resumes)
    core/         # security (JWT/hashing), auth dependency
    models/       # SQLAlchemy models (User, Resume)
    schemas/      # Pydantic request/response schemas
    services/     # business logic (resume parsing, ATS scoring, AI client)
    prompts/      # dedicated prompt builders per AI task
    config.py     # environment settings
    database.py   # SQLAlchemy engine/session
    main.py       # app entrypoint
  requirements.txt
  Dockerfile
  .env.example

frontend/
  src/
    components/   # Navbar, ProtectedRoute, ATSGauge, ui/ (Button, Input, Card)
    pages/         # Landing, Login, Register, ResumeAnalysis
    hooks/         # useAuth (auth context)
    services/      # axios client + API calls
    types/         # shared TS types
  .env.example

sample-data/
  sample_resume.pdf   # generated test PDF you can upload immediately

docker-compose.yml     # backend + Postgres for local dev
```

## Running it locally

### 1. Database

Easiest path — use Docker Compose for Postgres (and optionally the backend):

```bash
docker compose up db
```

Or point `DATABASE_URL` at any Postgres instance, including a free
[Neon](https://neon.tech) database for something closer to the deployment target.

### 2. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # edit DATABASE_URL / JWT_SECRET / GEMINI_API_KEY
uvicorn app.main:app --reload
```

Tables are created automatically on startup in development (`Base.metadata.create_all`).
For production, switch to Alembic migrations instead — see "Production notes" below.

API docs: `http://localhost:8000/docs`
Health check: `http://localhost:8000/api/health`

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL, defaults to http://localhost:8000
npm run dev
```

App: `http://localhost:5173`

### 4. Try it

1. Go to `/register`, create an account.
2. Go to `/resume`, upload `sample-data/sample_resume.pdf`, pick a target role, click **Analyze resume**.
3. You'll get an ATS score, extracted skills, missing skills, weaknesses, and suggestions.

## Running without a Gemini API key

`app/services/ai_service.py` checks whether `GEMINI_API_KEY` is a real key.
If it's still the placeholder value, every AI call returns a deterministic
mock response instead of calling the network — computed from simple keyword
matching against the resume text, so the demo is still meaningful (a resume
listing more relevant skills gets a higher mock score). Nothing else in the
app needs to know or care whether it's talking to a mock or the real model.

To use the real model: get a key from [Google AI Studio](https://aistudio.google.com/),
set `GEMINI_API_KEY` in `backend/.env`, restart the backend.

## Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full list.
Key ones:

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | backend | Postgres connection string |
| `JWT_SECRET` | backend | Signs auth tokens — set a real random value in production |
| `GEMINI_API_KEY` | backend | Gemini API key; left as placeholder = mock AI mode |
| `CORS_ORIGINS` | backend | Comma-separated list of allowed frontend origins |
| `VITE_API_URL` | frontend | Backend base URL |

## Deployment (as specified)

- **Frontend → Vercel**: set the project root to `frontend/`, build command `npm run build`, output `dist/`, and set `VITE_API_URL` to your Render backend URL.
- **Backend → Render**: create a Web Service from `backend/`, using the included `Dockerfile` (or `uvicorn app.main:app --host 0.0.0.0 --port $PORT` as the start command), and set the environment variables above.
- **Database → Neon PostgreSQL**: create a database, copy its connection string into `DATABASE_URL` on Render.

`docker-compose.yml` at the repo root runs backend + Postgres together for local development or self-hosting.

## Production notes

- Replace `Base.metadata.create_all` (dev convenience) with Alembic migrations before shipping schema changes to a real database.
- Rotate `JWT_SECRET` to a long random value; never commit `.env`.
- Add rate limiting on `/api/auth/*` and `/api/resumes/analyze` before exposing this publicly (resume analysis calls an LLM and is worth protecting from abuse).
- The mock AI fallback is meant for development/demo continuity, not production — production should fail loudly (or queue/retry) if `GEMINI_API_KEY` is missing rather than silently mocking.

## Extending this: adding the remaining flows

Each remaining flow (interview generation, answer evaluation, skill-gap
analysis, dashboard) follows the same four-file pattern already used for
resume analysis:

1. **Prompt** — add a builder function in `backend/app/prompts/` (see `ats_evaluator.py` as a template).
2. **Service** — add business logic in `backend/app/services/` that calls `ai_service.generate_json(prompt, mock_response)`.
3. **Schema** — add Pydantic request/response models in `backend/app/schemas/`.
4. **Route** — add a FastAPI router in `backend/app/api/`, include it in `app/main.py`.

`backend/app/prompts/future_flows.py` has commented stubs for the three
remaining prompt builders to start from. On the frontend, add a page under
`src/pages/`, a service module under `src/services/`, and a route in `App.tsx`
— `ResumeAnalysis.tsx` is the closest existing example (upload → call API →
render structured AI output).

Suggested build order: Interview Creation → Interview Session (question-by-question
with AI answer evaluation) → Skill Gap Analysis → Dashboard (aggregates data
that already exists once the above are in place).
