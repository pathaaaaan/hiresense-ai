"""Prompt for the Skill Gap Analyzer / Learning Roadmap AI task.

Combines ATS-detected missing skills with weak areas observed during the mock
interview so the roadmap prioritizes what the candidate actually struggled with.
"""


def build_skill_gap_prompt(
    target_role: str,
    resume_skills: list[str],
    missing_skills: list[str],
    weak_areas: list[str],
    strong_areas: list[str],
) -> str:
    return f"""You are a career coach building a personalized learning roadmap.

Target role: "{target_role}"
Resume skills: {", ".join(resume_skills) or "none"}
Skills missing for the role (from ATS analysis): {", ".join(missing_skills) or "none"}
Weak areas observed in a mock interview: {", ".join(weak_areas) or "none"}
Strong areas observed in a mock interview: {", ".join(strong_areas) or "none"}

Prioritize the weak interview areas and missing skills first. Return ONLY valid
JSON (no markdown fences, no commentary) matching exactly this shape:

{{
  "missing_skills": ["string", ...],
  "weak_skills": ["string", ...],
  "strong_skills": ["string", ...],
  "beginner_plan": [{{"title": "string", "description": "string", "duration": "string"}}],
  "intermediate_plan": [{{"title": "string", "description": "string", "duration": "string"}}],
  "advanced_plan": [{{"title": "string", "description": "string", "duration": "string"}}],
  "resources": [{{"skill": "string", "title": "string", "url": "string", "type": "course|docs|video|book"}}],
  "estimated_duration": "e.g. 10 weeks"
}}

Guidance:
- 3-5 items per plan level, ordered by priority (weak interview areas first).
- Resources should be well-known, real learning resources.
- Keep every description to one concise, specific sentence.
"""
