import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Roadmap(Base):
    """Personalized learning plan generated from ATS gaps + interview performance."""

    __tablename__ = "roadmaps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id"), nullable=False)

    target_role = Column(String(120), nullable=False)

    missing_skills = Column(JSONB, default=list)
    weak_skills = Column(JSONB, default=list)
    strong_skills = Column(JSONB, default=list)
    beginner_plan = Column(JSONB, default=list)
    intermediate_plan = Column(JSONB, default=list)
    advanced_plan = Column(JSONB, default=list)
    resources = Column(JSONB, default=list)
    estimated_duration = Column(String(120), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="roadmaps")
    resume = relationship("Resume", back_populates="roadmaps")
