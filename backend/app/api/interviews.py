import uuid
from statistics import mean

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.interview import (
    Difficulty,
    Evaluation,
    InterviewSession,
    Question,
    QuestionType,
    Response,
    SessionStatus,
)
from app.models.resume import Resume
from app.models.roadmap import Roadmap
from app.models.user import User
from app.schemas.interview import (
    AnswerIn,
    InterviewCreateIn,
    InterviewCreateOut,
    InterviewListItem,
    InterviewReportOut,
    QuestionOut,
    SubmitAnswerOut,
)
from app.services.evaluation_service import (
    RUBRIC_KEYS,
    evaluate_answer,
    generate_overall_feedback,
)
from app.services.interview_service import generate_interview_questions
from app.services.roadmap_service import generate_skill_gap_roadmap

router = APIRouter(prefix="/api/interviews", tags=["interviews"])

_TYPE_ORDER = (
    ("hr", QuestionType.HR),
    ("technical", QuestionType.TECHNICAL),
    ("project", QuestionType.PROJECT),
)

_RUBRIC_LABELS = {
    "technical_accuracy": "Technical depth",
    "communication": "Communication",
    "clarity": "Clarity",
    "confidence": "Confidence",
    "completeness": "Completeness",
}


def _get_owned_session(session_id: uuid.UUID, db: Session, user: User) -> InterviewSession:
    session = (
        db.query(InterviewSession)
        .filter(InterviewSession.id == session_id, InterviewSession.user_id == user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")
    return session


def _rubric_strengths_weaknesses(evaluations: list[Evaluation]) -> tuple[list[str], list[str]]:
    weak, strong = [], []
    for key in RUBRIC_KEYS:
        avg = mean(getattr(e, key) for e in evaluations)
        if avg < 6.5:
            weak.append(_RUBRIC_LABELS[key])
        elif avg >= 7.5:
            strong.append(_RUBRIC_LABELS[key])
    return weak, strong


def _upsert_roadmap(db: Session, session: InterviewSession) -> None:
    """Regenerate the resume's learning roadmap using interview performance as context."""
    resume = session.resume
    evaluations = [r.evaluation for r in session.responses if r.evaluation]
    weak, strong = _rubric_strengths_weaknesses(evaluations) if evaluations else ([], [])

    # Low-scoring technical/project answers push their topics up the roadmap priority.
    weak_topics = [
        r.question.question_text[:80]
        for r in session.responses
        if r.evaluation and r.evaluation.overall_score < 6
        and r.question.question_type != QuestionType.HR
    ][:3]

    data = generate_skill_gap_roadmap(
        target_role=session.target_role,
        resume_skills=resume.skills or [],
        missing_skills=resume.missing_skills or [],
        weak_areas=[*weak, *weak_topics],
        strong_areas=strong,
    )

    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.resume_id == resume.id, Roadmap.user_id == session.user_id)
        .first()
    )
    if roadmap is None:
        roadmap = Roadmap(user_id=session.user_id, resume_id=resume.id, target_role=session.target_role)
        db.add(roadmap)

    roadmap.target_role = session.target_role
    for field in (
        "missing_skills", "weak_skills", "strong_skills", "beginner_plan",
        "intermediate_plan", "advanced_plan", "resources", "estimated_duration",
    ):
        setattr(roadmap, field, data[field])


def _build_report(session: InterviewSession) -> dict:
    questions = sorted(session.questions, key=lambda q: q.order_index)
    responses_by_question = {r.question_id: r for r in session.responses}
    evaluations = [r.evaluation for r in session.responses if r.evaluation]

    rubric_averages = {
        key: round(mean(getattr(e, key) for e in evaluations), 1) if evaluations else 0.0
        for key in RUBRIC_KEYS
    }

    results = []
    for question in questions:
        response = responses_by_question.get(question.id)
        results.append(
            {
                "question": question,
                "answer_text": response.answer_text if response else None,
                "evaluation": response.evaluation if response and response.evaluation else None,
            }
        )

    return {
        "session_id": session.id,
        "resume_id": session.resume_id,
        "target_role": session.target_role,
        "status": session.status,
        "overall_score": session.overall_score,
        "overall_feedback": session.overall_feedback,
        "rubric_averages": rubric_averages,
        "answered_questions": len(responses_by_question),
        "total_questions": len(questions),
        "results": results,
        "created_at": session.created_at,
    }


@router.post("/create", response_model=InterviewCreateOut, status_code=status.HTTP_201_CREATED)
def create_interview(
    payload: InterviewCreateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = (
        db.query(Resume)
        .filter(Resume.id == payload.resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    generated = generate_interview_questions(
        payload.target_role, resume.skills or [], resume.projects or []
    )

    session = InterviewSession(
        user_id=current_user.id,
        resume_id=resume.id,
        target_role=payload.target_role,
        status=SessionStatus.CREATED,
    )
    db.add(session)
    db.flush()

    order_index = 0
    for key, question_type in _TYPE_ORDER:
        for item in generated.get(key, []):
            db.add(
                Question(
                    session_id=session.id,
                    question_text=item["question_text"],
                    question_type=question_type,
                    ideal_answer=item.get("ideal_answer"),
                    difficulty=Difficulty(item.get("difficulty", "MEDIUM")),
                    order_index=order_index,
                )
            )
            order_index += 1

    db.commit()
    return {"session_id": session.id}


@router.get("", response_model=list[InterviewListItem])
def list_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.created_at.desc())
        .all()
    )


@router.get("/{session_id}/questions", response_model=list[QuestionOut])
def get_questions(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_owned_session(session_id, db, current_user)
    return sorted(session.questions, key=lambda q: q.order_index)


@router.post("/{session_id}/questions/{question_id}/submit", response_model=SubmitAnswerOut)
def submit_answer(
    session_id: uuid.UUID,
    question_id: uuid.UUID,
    payload: AnswerIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_owned_session(session_id, db, current_user)
    if session.status == SessionStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="This interview session is already completed."
        )

    question = (
        db.query(Question)
        .filter(Question.id == question_id, Question.session_id == session.id)
        .first()
    )
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Question not found in this session."
        )

    if db.query(Response).filter(Response.question_id == question.id).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="This question has already been answered."
        )

    response = Response(session_id=session.id, question_id=question.id, answer_text=payload.answer)
    db.add(response)
    db.flush()

    result = evaluate_answer(question.question_text, payload.answer, question.ideal_answer)
    evaluation = Evaluation(response_id=response.id, **result)
    db.add(evaluation)

    session.status = SessionStatus.IN_PROGRESS
    db.commit()
    db.refresh(evaluation)

    return {"question_id": question.id, "evaluation": evaluation}


@router.post("/{session_id}/finish", response_model=InterviewReportOut)
def finish_interview(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_owned_session(session_id, db, current_user)

    answered = [r for r in session.responses if r.evaluation]
    if not answered:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answer at least one question before finishing the interview.",
        )

    if session.status != SessionStatus.COMPLETED:
        average = round(mean(r.evaluation.overall_score for r in answered), 1)
        summaries = [
            {
                "type": r.question.question_type.value,
                "score": r.evaluation.overall_score,
                "question": r.question.question_text,
            }
            for r in answered
        ]
        session.overall_score = average
        session.overall_feedback = generate_overall_feedback(session.target_role, summaries, average)
        session.status = SessionStatus.COMPLETED
        _upsert_roadmap(db, session)
        db.commit()
        db.refresh(session)

    return _build_report(session)


@router.get("/{session_id}/results", response_model=InterviewReportOut)
def get_results(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_owned_session(session_id, db, current_user)
    return _build_report(session)
