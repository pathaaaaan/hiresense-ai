"""Prompt for the ATS Evaluator AI task.

Scores a resume against an (optional) target role the way an Applicant
Tracking System keyword/quality scanner would, and returns structured
weaknesses + actionable suggestions.
"""


def build_ats_evaluator_prompt(resume_text: str, skills: list[str], target_role: str | None) -> str:
    role_line = f'Target role: "{target_role}"' if target_role else "Target role: not specified (evaluate generally for software/tech roles)"

    return f"""You are an ATS (Applicant Tracking System) evaluation engine used by
recruiters. Score the resume below the way a real ATS + a critical recruiter would.

{role_line}
Extracted skills: {", ".join(skills) if skills else "none extracted"}

Return ONLY valid JSON (no markdown fences, no commentary) matching exactly
this shape:

{{
  "ats_score": 0-100 integer,
  "missing_skills": ["string", ...],
  "weaknesses": [{{"area": "string", "issue": "string"}}],
  "suggestions": [{{"area": "string", "suggestion": "string"}}]
}}

Scoring guidance:
- Weigh keyword alignment with the target role, quantified impact (numbers/metrics),
  formatting/parseability, and clarity of action verbs.
- "missing_skills" should be role-relevant skills absent from the resume.
- Keep each "issue" and "suggestion" to one concise, specific sentence.
- Give 3-6 weaknesses and 3-6 suggestions.

Resume text:
\"\"\"
{resume_text}
\"\"\"
"""
