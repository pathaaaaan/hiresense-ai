import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class SessionStatus(str, enum.Enum):
    CREATED = "CREATED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class QuestionType(str, enum.Enum):
    HR = "HR"
    TECHNICAL = "TECHNICAL"
    PROJECT = "PROJECT"


class Difficulty(str, enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


class InterviewSession(Base):
    """A complete mock interview session for one resume + target role."""

    __tablename__ = "interview_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id"), nullable=False)

    target_role = Column(String(120), nullable=False)
    status = Column(Enum(SessionStatus), default=SessionStatus.CREATED, nullable=False)
    overall_score = Column(Float, nullable=True)
    overall_feedback = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="interview_sessions")
    resume = relationship("Resume", back_populates="interview_sessions")
    questions = relationship(
        "Question",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="Question.order_index",
    )
    responses = relationship("Response", back_populates="session", cascade="all, delete-orphan")


class Question(Base):
    """A generated interview question, with its AI-suggested ideal answer."""

    __tablename__ = "interview_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("interview_sessions.id"), nullable=False)

    question_text = Column(Text, nullable=False)
    question_type = Column(Enum(QuestionType), nullable=False)
    ideal_answer = Column(Text, nullable=True)
    difficulty = Column(Enum(Difficulty), default=Difficulty.MEDIUM, nullable=False)
    order_index = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="questions")
    response = relationship(
        "Response", back_populates="question", uselist=False, cascade="all, delete-orphan"
    )


class Response(Base):
    """A candidate answer to one question."""

    __tablename__ = "interview_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("interview_sessions.id"), nullable=False)
    question_id = Column(UUID(as_uuid=True), ForeignKey("interview_questions.id"), nullable=False)

    answer_text = Column(Text, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="responses")
    question = relationship("Question", back_populates="response")
    evaluation = relationship(
        "Evaluation", back_populates="response", uselist=False, cascade="all, delete-orphan"
    )


class Evaluation(Base):
    """AI rubric evaluation of one response. All rubric scores are out of 10."""

    __tablename__ = "interview_evaluations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    response_id = Column(
        UUID(as_uuid=True), ForeignKey("interview_responses.id"), nullable=False, unique=True
    )

    technical_accuracy = Column(Float, nullable=False)
    communication = Column(Float, nullable=False)
    clarity = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    completeness = Column(Float, nullable=False)
    overall_score = Column(Float, nullable=False)

    feedback = Column(Text, nullable=True)
    improvement_suggestions = Column(Text, nullable=True)
    ideal_answer = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    response = relationship("Response", back_populates="evaluation")
