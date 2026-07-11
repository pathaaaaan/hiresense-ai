from statistics import mean

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.interview import Evaluation, InterviewSession, Response, SessionStatus
from app.models.resume import Resume
from app.models.user import User
from app.schemas.analytics import DashboardOut
from app.services.evaluation_service import RUBRIC_KEYS

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

_RUBRIC_LABELS = {
    "technical_accuracy": "Technical depth",
    "communication": "Communication",
    "clarity": "Clarity",
    "confidence": "Confidence",
    "completeness": "Completeness",
}


@router.get("/dashboard", response_model=DashboardOut)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.created_at.asc())
        .all()
    )
    completed = [
        s for s in sessions if s.status == SessionStatus.COMPLETED and s.overall_score is not None
    ]

    ats_scores = [
        score
        for (score,) in db.query(Resume.ats_score).filter(Resume.user_id == current_user.id).all()
        if score is not None
    ]

    evaluations = (
        db.query(Evaluation)
        .join(Response, Evaluation.response_id == Response.id)
        .join(InterviewSession, Response.session_id == InterviewSession.id)
        .filter(InterviewSession.user_id == current_user.id)
        .all()
    )

    weak_areas, strong_areas = [], []
    if evaluations:
        for key, label in _RUBRIC_LABELS.items():
            avg = mean(getattr(e, key) for e in evaluations)
            if avg < 6.5:
                weak_areas.append(label)
            elif avg >= 7.5:
                strong_areas.append(label)

    return {
        "interviews_taken": len(completed),
        "average_score": round(mean(s.overall_score for s in completed), 1) if completed else 0.0,
        "average_ats_score": round(mean(ats_scores), 1) if ats_scores else 0.0,
        "weak_areas": weak_areas,
        "strong_areas": strong_areas,
        "progress_history": [
            {"date": s.created_at, "score": s.overall_score, "target_role": s.target_role}
            for s in completed
        ],
    }
