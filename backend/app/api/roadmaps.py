import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.resume import Resume
from app.models.roadmap import Roadmap
from app.models.user import User
from app.schemas.roadmap import RoadmapOut
from app.services.roadmap_service import generate_skill_gap_roadmap

router = APIRouter(prefix="/api/roadmaps", tags=["roadmaps"])


@router.get("/{resume_id}", response_model=RoadmapOut)
def get_roadmap(
    resume_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.resume_id == resume.id, Roadmap.user_id == current_user.id)
        .first()
    )

    if roadmap is None:
        # No interview finished yet - generate from the resume's ATS analysis alone.
        target_role = resume.target_role or "Software Engineer"
        data = generate_skill_gap_roadmap(
            target_role=target_role,
            resume_skills=resume.skills or [],
            missing_skills=resume.missing_skills or [],
            weak_areas=[],
            strong_areas=(resume.skills or [])[:5],
        )
        roadmap = Roadmap(
            user_id=current_user.id,
            resume_id=resume.id,
            target_role=target_role,
            **data,
        )
        db.add(roadmap)
        db.commit()
        db.refresh(roadmap)

    return roadmap
