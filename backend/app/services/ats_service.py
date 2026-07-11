"""ATS scoring: takes parsed resume text + skills and a target role,
returns a score plus structured weaknesses/suggestions/missing skills.
"""
from app.prompts.ats_evaluator import build_ats_evaluator_prompt
from app.services.ai_service import generate_json

# Small role -> expected-skill map used only to build a believable mock
# score/gap analysis when no Gemini key is configured.
_ROLE_SKILL_EXPECTATIONS = {
    "full stack developer": ["react", "node.js", "sql", "rest api", "git", "docker"],
    "software engineer": ["python", "java", "sql", "git", "ci/cd"],
    "ai/ml engineer": ["python", "pytorch", "tensorflow", "pandas", "machine learning"],
    "data analyst": ["sql", "excel", "power bi", "tableau", "python", "data analysis"],
}


def _mock_ats_evaluation(skills: list[str], target_role: str | None) -> dict:
    skills_lower = {s.lower() for s in skills}
    expected = _ROLE_SKILL_EXPECTATIONS.get((target_role or "").lower(), [])
    missing = [s for s in expected if s not in skills_lower] if expected else []

    base_score = 55
    base_score += min(len(skills), 12) * 3  # reward breadth of detected skills
    base_score -= len(missing) * 5
    score = max(20, min(96, base_score))

    weaknesses = [
        {"area": "Quantified impact", "issue": "Few bullet points include measurable results (%, time saved, scale)."},
        {"area": "Keyword coverage", "issue": "Resume text uses fewer role-specific keywords than typical ATS thresholds expect."},
    ]
    if missing:
        weaknesses.append({
            "area": "Skill coverage",
            "issue": f"Missing skills commonly expected for this role: {', '.join(missing[:5])}.",
        })

    suggestions = [
        {"area": "Impact", "suggestion": "Add numbers to at least 3 bullet points (e.g. 'reduced load time by 30%')."},
        {"area": "Formatting", "suggestion": "Use standard section headers (Experience, Education, Skills) for ATS parsers."},
    ]
    if missing:
        suggestions.append({
            "area": "Skills",
            "suggestion": f"Add or highlight experience with: {', '.join(missing[:5])}.",
        })

    return {
        "ats_score": score,
        "missing_skills": [s.title() for s in missing],
        "weaknesses": weaknesses,
        "suggestions": suggestions,
    }


def evaluate_ats(resume_text: str, skills: list[str], target_role: str | None) -> dict:
    prompt = build_ats_evaluator_prompt(resume_text, skills, target_role)
    result = generate_json(prompt, mock_response=_mock_ats_evaluation(skills, target_role))

    return {
        "ats_score": float(result.get("ats_score", 0)),
        "missing_skills": result.get("missing_skills", []),
        "weaknesses": result.get("weaknesses", []),
        "suggestions": result.get("suggestions", []),
    }
