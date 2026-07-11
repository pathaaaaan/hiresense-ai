"""Interview question generation: takes the target role plus the candidate's
extracted skills/projects and returns 5 HR + 10 technical + 5 project questions,
each with an ideal answer and difficulty. Output is validated/normalized so the
API layer can always trust the shape.
"""
from app.prompts.interview_generator import build_interview_generator_prompt
from app.services.ai_service import generate_json

_VALID_DIFFICULTIES = {"EASY", "MEDIUM", "HARD"}
_COUNTS = {"hr": 5, "technical": 10, "project": 5}

_HR_TEMPLATES = [
    ("Tell me about yourself and why you are targeting a {role} position.", "EASY"),
    ("Describe a time you received difficult feedback. How did you respond?", "MEDIUM"),
    ("Why do you want to work as a {role}, and what motivates you day to day?", "EASY"),
    ("Tell me about a conflict you had while working in a team and how you resolved it.", "MEDIUM"),
    ("Where do you see yourself in three years, and how does this role fit that plan?", "EASY"),
]

_PROJECT_TEMPLATES = [
    "What problem does {name} solve, and how did you architect it?",
    "What was the hardest technical challenge in {name}, and how did you overcome it?",
    "If you rebuilt {name} today, what would you change and why?",
    "How did you test and deploy {name}?",
    "What measurable impact or results did {name} achieve?",
]


def _mock_questions(role: str, skills: list[str], projects: list[dict]) -> dict:
    """Deterministic, resume-aware question set used when Gemini is unavailable."""
    skills = [s for s in (skills or []) if s] or ["problem solving"]
    tech_topics = (
        skills
        + [
            "data structures", "algorithms", "databases", "REST APIs", "testing",
            "debugging", "system design", "version control", "cloud deployment",
            "performance optimization",
        ]
    )[:10]

    hr = [
        {
            "question_text": template.format(role=role),
            "ideal_answer": (
                f"A strong answer is structured (STAR), specific, and ties personal "
                f"motivation and past experience directly to the {role} role."
            ),
            "difficulty": difficulty,
        }
        for template, difficulty in _HR_TEMPLATES
    ]

    technical = []
    for i, topic in enumerate(tech_topics):
        difficulty = "EASY" if i < 3 else ("MEDIUM" if i < 7 else "HARD")
        technical.append(
            {
                "question_text": (
                    f"Explain how you have used {topic} in practice, and walk me "
                    f"through a problem you solved with it."
                ),
                "ideal_answer": (
                    f"A strong answer defines {topic} accurately, describes a concrete "
                    f"use case, explains the trade-offs considered, and quantifies the result."
                ),
                "difficulty": difficulty,
            }
        )

    project_names = [p.get("name") for p in (projects or []) if isinstance(p, dict) and p.get("name")]
    while len(project_names) < 5:
        project_names.append("one of your resume projects")

    project = [
        {
            "question_text": template.format(name=project_names[i]),
            "ideal_answer": (
                "A strong answer explains the context, the specific decisions made, "
                "the trade-offs, and closes with the measurable outcome."
            ),
            "difficulty": "MEDIUM",
        }
        for i, template in enumerate(_PROJECT_TEMPLATES)
    ]

    return {"hr": hr, "technical": technical, "project": project}


def _normalize(raw: dict, fallback: dict) -> dict:
    """Coerce arbitrary model output into the exact shape the API layer expects."""
    normalized = {}
    for key, count in _COUNTS.items():
        items = raw.get(key) if isinstance(raw.get(key), list) else []
        cleaned = []
        for item in items:
            if not isinstance(item, dict):
                continue
            text = str(item.get("question_text") or item.get("question") or "").strip()
            if not text:
                continue
            difficulty = str(item.get("difficulty", "MEDIUM")).upper()
            cleaned.append(
                {
                    "question_text": text,
                    "ideal_answer": str(item.get("ideal_answer") or "").strip(),
                    "difficulty": difficulty if difficulty in _VALID_DIFFICULTIES else "MEDIUM",
                }
            )
        normalized[key] = (cleaned or fallback[key])[:count]
    return normalized


def generate_interview_questions(role: str, skills: list[str], projects: list[dict]) -> dict:
    fallback = _mock_questions(role, skills, projects)
    prompt = build_interview_generator_prompt(role, skills, projects)
    raw = generate_json(prompt, mock_response=fallback)
    return _normalize(raw, fallback)
