import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.deps import get_current_user
from app.database import get_db
from app.models.resume import Resume
from app.models.user import User
from app.schemas.resume import ResumeAnalysisOut, ResumeListItem
from app.services.ats_service import evaluate_ats
from app.services.resume_parser import parse_resume

router = APIRouter(prefix="/api/resumes", tags=["resumes"])
settings = get_settings()


@router.post("/analyze", response_model=ResumeAnalysisOut, status_code=status.HTTP_201_CREATED)
async def analyze_resume(
    file: UploadFile = File(...),
    target_role: str | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF resumes are supported.")

    file_bytes = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.max_upload_mb}MB limit.",
        )

    try:
        parsed = parse_resume(file_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    ats_result = evaluate_ats(parsed["raw_text"], parsed["skills"], target_role)

    resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        raw_text=parsed["raw_text"],
        skills=parsed["skills"],
        education=parsed["education"],
        projects=parsed["projects"],
        experience=parsed["experience"],
        target_role=target_role,
        ats_score=ats_result["ats_score"],
        missing_skills=ats_result["missing_skills"],
        weaknesses=ats_result["weaknesses"],
        suggestions=ats_result["suggestions"],
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return resume


@router.get("", response_model=list[ResumeListItem])
def list_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .all()
    )


@router.get("/{resume_id}", response_model=ResumeAnalysisOut)
def get_resume(
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
    return resume
