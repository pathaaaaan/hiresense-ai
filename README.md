# HireSense AI 🎯

> An AI-powered interview preparation platform — upload your resume, generate a personalized mock interview, get real-time AI feedback, and follow a custom learning roadmap.

---

## ✨ Features

| Flow | Status |
|------|--------|
| JWT-based Registration & Login | ✅ Complete |
| PDF Resume Upload & Parsing | ✅ Complete |
| AI Resume Analysis (skills / education / projects / experience) | ✅ Complete |
| ATS Scoring with Weaknesses & Suggestions | ✅ Complete |
| AI Mock Interview Generation (HR + Technical + Project questions) | ✅ Complete |
| Question-by-question Interview Session with Timer | ✅ Complete |
| Real-time AI Answer Evaluation (5-rubric scoring) | ✅ Complete |
| Final Interview Report with Radar Chart | ✅ Complete |
| Skill Gap Analysis & Personalized Learning Roadmap | ✅ Complete |
| Progress Dashboard with Charts | ✅ Complete |
| Mock AI fallback (works without a Gemini key) | ✅ Complete |

---

## 🗺️ Application Flow

```
Register / Login
       │
       ▼
Upload PDF Resume ──▶ ATS Score + Extracted Skills
       │
       ▼
Choose Target Role (AI/ML Engineer, Full Stack, etc.)
       │
       ▼
AI Generates 20 Questions (5 HR · 10 Technical · 5 Project)
       │
       ▼
Mock Interview — answer one question at a time
       │
       ▼
AI Evaluates Each Answer (Technical · Communication · Clarity · Confidence · Completeness)
       │
       ▼
Final Report — overall score, radar chart, ideal answers, feedback
       │
       ▼
Skill Gap Analysis ──▶ Personalized Learning Roadmap
       │
       ▼
Dashboard — tracks all interviews, ATS scores, progress over time
```

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** — REST API framework
- **SQLAlchemy** — ORM with PostgreSQL
- **Gemini 2.5 Flash** — AI for parsing, generation, and evaluation
- **PyMuPDF + pdfplumber** — PDF text extraction
- **python-jose** — JWT authentication
- **bcrypt** — password hashing
- **Pydantic v2** — request/response validation

### Frontend
- **React 19 + TypeScript** — UI framework
- **Vite** — build tool
- **Tailwind CSS** — styling
- **Shadcn UI** — component library
- **Recharts** — progress and radar charts
- **Framer Motion** — animations
- **React Router v6** — routing
- **Axios** — HTTP client

### Database
- **PostgreSQL** — primary database
- Tables: `users`, `resumes`, `interview_sessions`, `questions`, `responses`, `evaluations`, `roadmaps`

---

## 📁 Project Structure

```
hiresense-ai/
├── backend/
│   ├── app/
│   │   ├── api/               # FastAPI routers
│   │   │   ├── auth.py            # register, login, /me
│   │   │   ├── resume.py          # upload, analyze, list
│   │   │   ├── interviews.py      # create session, submit answers, finish
│   │   │   ├── roadmaps.py        # get roadmap per resume
│   │   │   └── analytics.py       # dashboard metrics
│   │   ├── core/
│   │   │   ├── security.py        # JWT + bcrypt helpers
│   │   │   └── deps.py            # get_current_user FastAPI dependency
│   │   ├── models/                # SQLAlchemy ORM models
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   ├── services/              # Business logic + AI service layer
│   │   │   ├── ai_service.py          # Gemini client (with mock fallback)
│   │   │   ├── resume_parser.py       # PDF → structured data
│   │   │   ├── ats_service.py         # ATS scoring
│   │   │   ├── interview_service.py   # question generation
│   │   │   ├── evaluation_service.py  # answer evaluation
│   │   │   └── roadmap_service.py     # skill gap + roadmap
│   │   ├── prompts/               # Gemini prompt builders
│   │   ├── config.py              # pydantic-settings env config
│   │   ├── database.py            # SQLAlchemy engine + session
│   │   └── main.py                # app entrypoint + CORS
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── ProtectedRoute.tsx
│       │   ├── ATSGauge.tsx
│       │   └── ui/               # Button, Card, Input, Skeleton, Toast…
│       ├── pages/
│       │   ├── Landing.tsx
│       │   ├── Login.tsx
│       │   ├── Register.tsx
│       │   ├── ResumeAnalysis.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Interview.tsx
│       │   ├── InterviewResults.tsx
│       │   └── Roadmap.tsx
│       ├── hooks/useAuth.tsx      # auth context + provider
│       ├── services/              # typed Axios API wrappers
│       └── types/index.ts         # shared TypeScript types
│
├── sample-data/
│   └── sample_resume.pdf          # ready-to-use test resume
├── docker-compose.yml
└── .gitignore
```

---

## 🚀 Running Locally

### 1. Database

Start PostgreSQL with Docker:
```bash
docker compose up db
```
Or point `DATABASE_URL` at any Postgres instance (including [Neon](https://neon.tech) free tier).

### 2. Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in DATABASE_URL, JWT_SECRET, GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/health
- Tables are auto-created on first startup (dev only — use Alembic for production)

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:8000
npm run dev
```

App: http://localhost:5173

### 4. Try it end-to-end

1. Register at `/register`
2. Upload `sample-data/sample_resume.pdf` at `/resume`
3. Go to `/dashboard` → pick a role → **Start interview**
4. Answer each question and get instant AI feedback
5. View your final report and skill roadmap

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Random secret for signing tokens — **change in production** |
| `JWT_ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24h) |
| `GEMINI_API_KEY` | From [Google AI Studio](https://aistudio.google.com/) — leave as placeholder for mock mode |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `ENVIRONMENT` | `development` or `production` |
| `MAX_UPLOAD_MB` | `5` |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend base URL (e.g. `http://localhost:8000`) |

---

## 🌐 Deployment

**Stack:** Neon (PostgreSQL) → Render (FastAPI) → Vercel (React)

### 1. Push to GitHub
```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/hiresense-ai.git
git push -u origin main
```

### 2. Neon (Database)
- Create free project at [neon.tech](https://neon.tech)
- Copy the `postgresql://...` SQLAlchemy connection string

### 3. Render (Backend)
- New → Web Service → connect GitHub repo
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Add all backend env vars from the table above

### 4. Vercel (Frontend)
- New Project → import GitHub repo
- Root directory: `frontend`, Framework preset: `Vite`
- Add env var: `VITE_API_URL=https://your-backend.onrender.com`

### 5. Update CORS
Set `CORS_ORIGINS=https://your-app.vercel.app` on Render and redeploy.

---

## 🤖 Running Without a Gemini API Key

`app/services/ai_service.py` detects if `GEMINI_API_KEY` is missing or still set to the placeholder value, and automatically returns deterministic mock responses for every AI task — so the full app is demoable without any API credentials. Mock responses are computed from keyword matching on the resume text, so they still meaningfully reflect the uploaded resume.

Set a real key in `backend/.env` and restart to enable live Gemini responses.

---

## 🔒 Production Checklist

- [ ] Replace `Base.metadata.create_all` with Alembic migrations
- [ ] Set a strong random `JWT_SECRET` (e.g. `openssl rand -hex 32`)
- [ ] Never commit `.env` files (covered by `.gitignore`)
- [ ] Add rate limiting on `/api/auth/*` and `/api/resumes/analyze`
- [ ] Set `ENVIRONMENT=production`
- [ ] Set `CORS_ORIGINS` to only your production frontend URL
- [ ] Use a keep-alive ping service to prevent Render cold starts on free tier

---

## 📄 License

MIT
