import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class RoadmapOut(BaseModel):
    id: uuid.UUID
    resume_id: uuid.UUID
    target_role: str

    missing_skills: list[str]
    weak_skills: list[str]
    strong_skills: list[str]
    beginner_plan: list[dict[str, Any]]
    intermediate_plan: list[dict[str, Any]]
    advanced_plan: list[dict[str, Any]]
    resources: list[dict[str, Any]]
    estimated_duration: str | None

    created_at: datetime

    class Config:
        from_attributes = True
