import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.interview import Difficulty, QuestionType, SessionStatus


class InterviewCreateIn(BaseModel):
    resume_id: uuid.UUID
    target_role: str = Field(min_length=2, max_length=120)


class InterviewCreateOut(BaseModel):
    session_id: uuid.UUID


class QuestionOut(BaseModel):
    id: uuid.UUID
    question_text: str
    question_type: QuestionType
    difficulty: Difficulty
    order_index: int

    class Config:
        from_attributes = True


class AnswerIn(BaseModel):
    answer: str = Field(min_length=1, max_length=8000)


class EvaluationOut(BaseModel):
    technical_accuracy: float
    communication: float
    clarity: float
    confidence: float
    completeness: float
    overall_score: float
    feedback: str | None
    improvement_suggestions: str | None
    ideal_answer: str | None

    class Config:
        from_attributes = True


class SubmitAnswerOut(BaseModel):
    question_id: uuid.UUID
    evaluation: EvaluationOut


class QuestionResultOut(BaseModel):
    question: QuestionOut
    answer_text: str | None = None
    evaluation: EvaluationOut | None = None


class InterviewReportOut(BaseModel):
    session_id: uuid.UUID
    resume_id: uuid.UUID
    target_role: str
    status: SessionStatus
    overall_score: float | None
    overall_feedback: str | None
    rubric_averages: dict[str, float]
    answered_questions: int
    total_questions: int
    results: list[QuestionResultOut]
    created_at: datetime


class InterviewListItem(BaseModel):
    id: uuid.UUID
    resume_id: uuid.UUID
    target_role: str
    status: SessionStatus
    overall_score: float | None
    created_at: datetime

    class Config:
        from_attributes = True
