"""Prompt for the Interview Question Generator AI task.

Generates 5 HR + 10 technical + 5 project questions personalized to the
candidate's extracted skills, projects, and selected target role.
"""
import json


def build_interview_generator_prompt(role: str, skills: list[str], projects: list[dict]) -> str:
    project_json = json.dumps(projects[:5], default=str) if projects else "[]"

    return f"""You are a senior technical interviewer preparing a personalized mock
interview for a candidate.

Target role: "{role}"
Candidate skills: {", ".join(skills) if skills else "none extracted"}
Candidate projects (JSON): {project_json}

Generate interview questions personalized to the candidate's actual skills,
projects, and the target role. Return ONLY valid JSON (no markdown fences,
no commentary) matching exactly this shape:

{{
  "hr": [{{"question_text": "string", "ideal_answer": "string", "difficulty": "EASY|MEDIUM|HARD"}}],
  "technical": [{{"question_text": "string", "ideal_answer": "string", "difficulty": "EASY|MEDIUM|HARD"}}],
  "project": [{{"question_text": "string", "ideal_answer": "string", "difficulty": "EASY|MEDIUM|HARD"}}]
}}

Requirements:
- Exactly 5 "hr" questions (behavioral, motivation, teamwork) tied to the role.
- Exactly 10 "technical" questions grounded in the candidate's listed skills and
  the core competencies of the target role, with a mix of difficulties.
- Exactly 5 "project" questions that reference the candidate's actual projects
  (architecture decisions, trade-offs, hardest challenges, measurable impact).
- Every question must include a concise, high-quality "ideal_answer"
  (3-6 sentences) that an interviewer would accept as a strong answer.
"""
