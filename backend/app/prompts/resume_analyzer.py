"""Prompt for the Resume Analyzer AI task.

Extracts structured skills / education / projects / experience from raw
resume text. Must return JSON only, matching RESUME_ANALYZER_SCHEMA below,
so the response can be parsed directly into app.schemas.resume fields.
"""

RESUME_ANALYZER_SCHEMA = {
    "skills": ["string"],
    "education": [{"institution": "string", "degree": "string", "year": "string"}],
    "projects": [{"name": "string", "description": "string", "technologies": ["string"]}],
    "experience": [
        {"company": "string", "role": "string", "duration": "string", "description": "string"}
    ],
}


def build_resume_analyzer_prompt(resume_text: str) -> str:
    return f"""You are an expert technical resume parser.

Read the resume text below and extract structured information from it.

Return ONLY valid JSON (no markdown fences, no commentary) matching exactly
this shape:

{{
  "skills": ["string", ...],
  "education": [{{"institution": "string", "degree": "string", "year": "string"}}],
  "projects": [{{"name": "string", "description": "string", "technologies": ["string", ...]}}],
  "experience": [{{"company": "string", "role": "string", "duration": "string", "description": "string"}}]
}}

Rules:
- "skills" should include technical skills, languages, frameworks, and tools explicitly stated or clearly implied by projects/experience.
- Do not invent institutions, companies, or dates that are not in the text.
- If a section is absent from the resume, return an empty list for it.

Resume text:
\"\"\"
{resume_text}
\"\"\"
"""
