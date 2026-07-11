import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    filename = Column(String(255), nullable=False)
    raw_text = Column(Text, nullable=False)

    # Parsed structure (see app/prompts/resume_analyzer.py for the shape)
    skills = Column(ARRAY(String), default=list)
    education = Column(JSONB, default=list)
    projects = Column(JSONB, default=list)
    experience = Column(JSONB, default=list)

    # ATS evaluation (see app/prompts/ats_evaluator.py for the shape)
    ats_score = Column(Float, nullable=True)
    missing_skills = Column(ARRAY(String), default=list)
    weaknesses = Column(JSONB, default=list)
    suggestions = Column(JSONB, default=list)

    target_role = Column(String(120), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="resumes")
