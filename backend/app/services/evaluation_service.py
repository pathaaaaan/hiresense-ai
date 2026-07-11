"""Answer evaluation: scores each candidate answer against a fixed 5-dimension
rubric (all out of 10) and produces a final whole-session debrief. All model
output is clamped/validated so bad AI responses can never break the API.
"""
from statistics import mean

from app.prompts.answer_evaluator import (
    build_answer_evaluator_prompt,
    build_overall_feedback_prompt,
)
from app.services.ai_service import generate_json

RUBRIC_KEYS = ("technical_accuracy", "communication", "clarity", "confidence", "completeness")


def _clamp_score(value, default: float) -> float:
    try:
        return round(min(10.0, max(0.0, float(value))), 1)
    except (TypeError, ValueError):
        return default


def _mock_evaluation(question: str, answer: str, ideal_answer: str | None) -> dict:
    """Heuristic scoring (length + overlap with the ideal answer) for mock mode."""
    words = answer.split()
    base = 4.0 + min(len(words) / 40, 3.0)  # reward substance up to ~120 words
    if ideal_answer:
        overlap = len({w.lower() for w in words} & {w.lower() for w in ideal_answer.split()})
        base += min(overlap / 10, 2.0)
    base = min(base, 9.0)

    offsets = (0.0, 0.4, 0.2, -0.3, -0.5)
    scores = {
        key: round(min(10.0, max(2.0, base + offset)), 1)
        for key, offset in zip(RUBRIC_KEYS, offsets)
    }
    return {
        **scores,
        "overall_score": round(mean(scores.values()), 1),
        "feedback": (
            "Your answer covers the core idea but stays fairly general. Anchoring it in a "
            "concrete example with specifics and measurable results would make it far more convincing."
        ),
        "improvement_suggestions": (
            "Structure your answer with the STAR method, name the exact tools or techniques "
            "you used, and finish with the measurable outcome."
        ),
        "ideal_answer": ideal_answer
        or (
            "A strong answer directly addresses the question, uses a concrete example, "
            "explains the reasoning and trade-offs, and closes with a measurable result."
        ),
    }


def evaluate_answer(question: str, answer: str, ideal_answer: str | None) -> dict:
    mock = _mock_evaluation(question, answer, ideal_answer)
    prompt = build_answer_evaluator_prompt(question, answer, ideal_answer)
    raw = generate_json(prompt, mock_response=mock)

    scores = {key: _clamp_score(raw.get(key), default=mock[key]) for key in RUBRIC_KEYS}
    overall = _clamp_score(raw.get("overall_score"), default=round(mean(scores.values()), 1))

    return {
        **scores,
        "overall_score": overall,
        "feedback": str(raw.get("feedback") or mock["feedback"]),
        "improvement_suggestions": str(
            raw.get("improvement_suggestions") or mock["improvement_suggestions"]
        ),
        "ideal_answer": str(raw.get("ideal_answer") or ideal_answer or mock["ideal_answer"]),
    }


def generate_overall_feedback(
    target_role: str, question_summaries: list[dict], average_score: float
) -> str:
    mock_text = (
        f"You scored an average of {average_score}/10 across this mock interview for the "
        f"{target_role} role. You communicated your experience clearly in most answers, but "
        "several responses lacked depth and measurable results. Focus on structuring answers "
        "around concrete examples with quantified outcomes, and strengthen the weaker areas "
        "highlighted in your skill gap analysis."
    )
    prompt = build_overall_feedback_prompt(target_role, question_summaries, average_score)
    raw = generate_json(prompt, mock_response={"overall_feedback": mock_text})
    return str(raw.get("overall_feedback") or mock_text)
