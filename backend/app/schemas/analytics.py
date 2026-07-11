from datetime import datetime

from pydantic import BaseModel


class ProgressPoint(BaseModel):
    date: datetime
    score: float
    target_role: str


class DashboardOut(BaseModel):
    interviews_taken: int
    average_score: float
    average_ats_score: float
    weak_areas: list[str]
    strong_areas: list[str]
    progress_history: list[ProgressPoint]
