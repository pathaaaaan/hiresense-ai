"""Prompts for the Answer Evaluator AI task.

Scores a candidate answer against a fixed 5-dimension rubric (all out of 10)
and produces a final whole-session debrief.
"""


def build_answer_evaluator_prompt(question: str, answer: str, ideal_answer: str | None) -> str:
    return f"""You are a strict but fair interview coach evaluating a candidate's answer.

Question:
\"\"\"{question}\"\"\"

Candidate answer:
\"\"\"{answer}\"\"\"

Reference ideal answer:
\"\"\"{ideal_answer or "not provided - judge on general correctness"}\"\"\"

Score the answer on each rubric dimension from 0 to 10. Return ONLY valid JSON
(no markdown fences, no commentary) matching exactly this shape:

{{
  "technical_accuracy": 0-10,
  "communication": 0-10,
  "clarity": 0-10,
  "confidence": 0-10,
  "completeness": 0-10,
  "overall_score": 0-10 weighted overall with one decimal,
  "feedback": "2-4 sentence specific critique of this answer",
  "improvement_suggestions": "2-3 concrete, actionable improvements",
  "ideal_answer": "concise model answer the candidate should aim for"
}}
"""


def build_overall_feedback_prompt(
    target_role: str, question_summaries: list[dict], average_score: float
) -> str:
    lines = "\n".join(
        f"- [{q['type']}] score {q['score']}/10: {q['question'][:120]}"
        for q in question_summaries
    )

    return f"""You are an interview coach writing a final debrief for a mock interview.

Target role: "{target_role}"
Average score: {average_score}/10
Per-question results:
{lines}

Return ONLY valid JSON (no markdown fences, no commentary) with exactly this shape:

{{"overall_feedback": "4-6 sentence summary of overall performance, main strengths, main weaknesses, and the single most important thing to improve next"}}
"""
