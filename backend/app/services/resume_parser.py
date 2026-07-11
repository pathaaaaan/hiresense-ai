"""
Resume processing: PDF -> raw text -> structured (skills/education/projects/experience).

Text extraction tries PyMuPDF first (fast, good layout handling) and falls
back to pdfplumber (better on some table-heavy / non-standard PDFs) if the
first pass returns suspiciously little text.
"""
import io
import re

import fitz  # PyMuPDF
import pdfplumber

from app.prompts.resume_analyzer import build_resume_analyzer_prompt
from app.services.ai_service import generate_json

MIN_ACCEPTABLE_CHARS = 40

# Vocabulary used to build a plausible mock extraction when no Gemini key
# is configured, so the ATS-score demo still reflects the uploaded resume.
_KNOWN_SKILLS = [
    "python", "java", "javascript", "typescript", "react", "node.js", "node",
    "fastapi", "django", "flask", "express", "sql", "postgresql", "mysql",
    "mongodb", "docker", "kubernetes", "aws", "gcp", "azure", "git",
    "tensorflow", "pytorch", "pandas", "numpy", "scikit-learn", "html",
    "css", "tailwind", "next.js", "redux", "graphql", "rest api", "linux",
    "ci/cd", "machine learning", "deep learning", "nlp", "data analysis",
    "tableau", "power bi", "excel", "spring boot", "c++", "c#", "go", "rust",
]


def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            text = "\n".join(page.get_text() for page in doc)
    except Exception:
        text = ""

    if len(text.strip()) < MIN_ACCEPTABLE_CHARS:
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                text = "\n".join(page.extract_text() or "" for page in pdf.pages)
        except Exception:
            pass

    return text.strip()


def _mock_structured_extraction(resume_text: str) -> dict:
    lowered = resume_text.lower()
    found_skills = sorted({s for s in _KNOWN_SKILLS if s in lowered})

    return {
        "skills": [s.title() if s.islower() and " " not in s else s for s in found_skills],
        "education": [],
        "projects": [],
        "experience": [],
    }


def parse_resume(file_bytes: bytes) -> dict:
    """Returns {"raw_text": str, "skills": [...], "education": [...], "projects": [...], "experience": [...]}"""
    raw_text = extract_text_from_pdf(file_bytes)
    if not raw_text:
        raise ValueError("Could not extract any text from this PDF. Please upload a text-based PDF resume.")

    prompt = build_resume_analyzer_prompt(raw_text)
    structured = generate_json(prompt, mock_response=_mock_structured_extraction(raw_text))

    return {
        "raw_text": raw_text,
        "skills": structured.get("skills", []),
        "education": structured.get("education", []),
        "projects": structured.get("projects", []),
        "experience": structured.get("experience", []),
    }
