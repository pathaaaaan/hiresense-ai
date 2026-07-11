import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class EducationItem(BaseModel):
    institution: str | None = None
    degree: str | None = None
    year: str | None = None


class ExperienceItem(BaseModel):
    company: str | None = None
    role: str | None = None
    duration: str | None = None
    description: str | None = None


class ProjectItem(BaseModel):
    name: str | None = None
    description: str | None = None
    technologies: list[str] = []


class Suggestion(BaseModel):
    area: str
    suggestion: str


class ResumeAnalysisOut(BaseModel):
    id: uuid.UUID
    filename: str
    target_role: str | None

    skills: list[str]
    education: list[dict[str, Any]]
    projects: list[dict[str, Any]]
    experience: list[dict[str, Any]]

    ats_score: float | None
    missing_skills: list[str]
    weaknesses: list[dict[str, Any]]
    suggestions: list[dict[str, Any]]

    created_at: datetime

    class Config:
        from_attributes = True


class ResumeListItem(BaseModel):
    id: uuid.UUID
    filename: str
    target_role: str | None
    ats_score: float | None
    created_at: datetime

    class Config:
        from_attributes = True
