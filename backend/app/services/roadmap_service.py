"""Skill gap analysis + learning roadmap generation.

Combines ATS-detected missing skills with weak areas observed during the mock
interview (e.g. a weak Docker answer pushes Docker to the top of the roadmap).
Output is validated so the API layer always receives the expected shape.
"""
from app.prompts.skill_gap import build_skill_gap_prompt
from app.services.ai_service import generate_json

_ROADMAP_LIST_FIELDS = (
    "missing_skills",
    "weak_skills",
    "strong_skills",
    "beginner_plan",
    "intermediate_plan",
    "advanced_plan",
    "resources",
)


def _mock_roadmap(
    target_role: str,
    resume_skills: list[str],
    missing_skills: list[str],
    weak_areas: list[str],
    strong_areas: list[str],
) -> dict:
    # Weak interview areas come first so they get top priority in the plan.
    gaps = list(dict.fromkeys([*(weak_areas or []), *(missing_skills or [])])) or [
        "core fundamentals"
    ]
    top = gaps[:4]

    def plan(prefix: str, focus: str) -> list[dict]:
        return [
            {
                "title": f"{prefix} {skill}",
                "description": f"{focus} {skill} with hands-on practice targeted at the {target_role} role.",
                "duration": "1-2 weeks",
            }
            for skill in top
        ]

    return {
        "missing_skills": missing_skills or [],
        "weak_skills": weak_areas or [],
        "strong_skills": strong_areas or resume_skills[:5],
        "beginner_plan": plan("Foundations of", "Learn the fundamentals of"),
        "intermediate_plan": plan("Applied", "Build a small real-world project using"),
        "advanced_plan": plan("Advanced", "Master production-grade patterns and performance in"),
        "resources": [
            {
                "skill": skill,
                "title": f"Official {skill} documentation plus a project-based course",
                "url": "",
                "type": "course",
            }
            for skill in top
        ],
        "estimated_duration": f"{max(4, len(top) * 3)} weeks",
    }


def generate_skill_gap_roadmap(
    target_role: str,
    resume_skills: list[str],
    missing_skills: list[str],
    weak_areas: list[str],
    strong_areas: list[str],
) -> dict:
    mock = _mock_roadmap(target_role, resume_skills, missing_skills, weak_areas, strong_areas)
    prompt = build_skill_gap_prompt(
        target_role, resume_skills, missing_skills, weak_areas, strong_areas
    )
    raw = generate_json(prompt, mock_response=mock)

    result = {}
    for field in _ROADMAP_LIST_FIELDS:
        value = raw.get(field)
        result[field] = value if isinstance(value, list) else mock[field]
    result["estimated_duration"] = str(raw.get("estimated_duration") or mock["estimated_duration"])
    return result
