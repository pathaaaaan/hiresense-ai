from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, resume
from app.config import get_settings
from app.database import Base, engine

settings = get_settings()

app = FastAPI(
    title="HireSense AI",
    description="AI-powered interview preparation platform API.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(resume.router)


@app.on_event("startup")
def on_startup():
    # For local/dev convenience. In production, use Alembic migrations
    # instead of create_all (see backend/README.md).
    Base.metadata.create_all(bind=engine)


@app.get("/api/health", tags=["health"])
def health_check():
    return {
        "status": "ok",
        "environment": settings.environment,
        "ai_mocked": settings.ai_is_mocked,
    }
