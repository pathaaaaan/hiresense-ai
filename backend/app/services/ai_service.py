"""
Dedicated AI service layer.

Every call into Gemini goes through `generate_json`, which:
  1. Sends the prompt to Gemini 2.5 Flash asking for JSON-only output.
  2. Strips accidental markdown fences and parses the JSON.
  3. Falls back to a deterministic mock (no network call) when no real
     GEMINI_API_KEY is configured, so the rest of the app is fully
     runnable and demoable without credentials.

This isolation means resume_parser.py / ats_service.py never touch the
Gemini SDK directly - swapping models or providers only touches this file.
"""
import json
import logging
import re

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_genai_model = None


def _get_model():
    global _genai_model
    if _genai_model is None:
        import google.generativeai as genai

        genai.configure(api_key=settings.gemini_api_key)
        _genai_model = genai.GenerativeModel(settings.gemini_model)
    return _genai_model


def _strip_code_fences(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()
    return text


def generate_json(prompt: str, mock_response: dict) -> dict:
    """
    Sends `prompt` to Gemini and returns the parsed JSON response.
    If no real API key is configured, or the call/parse fails, returns
    `mock_response` instead so callers always get a usable result.
    """
    if settings.ai_is_mocked:
        logger.info("GEMINI_API_KEY not configured - returning mock AI response.")
        return mock_response

    try:
        model = _get_model()
        result = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"},
        )
        raw = _strip_code_fences(result.text)
        return json.loads(raw)
    except Exception:  # noqa: BLE001 - AI calls can fail in many ways; never crash the request
        logger.exception("Gemini call failed, falling back to mock response.")
        return mock_response
