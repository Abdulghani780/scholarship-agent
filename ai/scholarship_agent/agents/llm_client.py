"""
Universal LLM Client Supporting Google Gemini and OpenRouter
============================================================
Handles structured JSON responses, clean Markdown stripping,
and automatic provider dispatch.
"""

from __future__ import annotations

import json
import logging
import os
import urllib.request
from typing import Any

logger = logging.getLogger(__name__)

DEFAULT_GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "AQ.Ab8RN6Kq5VehOTFWzMN3-dVh2Wzsx_nlYlR4FT5gR9OnW-QnoA")
DEFAULT_MODEL = os.environ.get("SCHOLARSHIP_LLM", "gemini-2.5-flash")


def clean_json_response(raw_text: str) -> str:
    """Strip markdown fences (```json ... ```) and whitespace from response."""
    text = raw_text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        # Remove opening fence
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        # Remove closing fence
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


def call_llm(
    prompt: str,
    model_name: str | None = None,
    api_key: str | None = None,
    json_mode: bool = True,
    temperature: float = 0.2,
    timeout: int = 40,
) -> str:
    """
    Call either OpenRouter or Google Gemini based on the model name and API key.
    
    Provider Rules:
    - If api_key starts with 'sk-or-' or model contains '/' or model starts with 'openrouter':
      Dispatch to OpenRouter (https://openrouter.ai/api/v1/chat/completions)
    - Else:
      Dispatch to Google Gemini API
    """
    model = (model_name or DEFAULT_MODEL).strip()
    key = (api_key or "").strip()

    is_openrouter = (
        key.startswith("sk-or-")
        or ("/" in model)
        or ("openrouter" in model.lower())
        or bool(os.environ.get("OPENROUTER_API_KEY"))
    )

    if is_openrouter:
        or_key = key if key.startswith("sk-or-") else (os.environ.get("OPENROUTER_API_KEY") or key)
        url = "https://openrouter.ai/api/v1/chat/completions"
        payload: dict[str, Any] = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            "temperature": temperature,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {or_key}",
            "HTTP-Referer": "http://localhost:5174",
            "X-Title": "Scholarship Matcher & Planner Agent",
            "Content-Type": "application/json",
            "User-Agent": "ScholarshipAgent/1.0",
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        logger.info("Calling OpenRouter with model=%s", model)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            raw_content = data["choices"][0]["message"]["content"]
            return clean_json_response(raw_content)

    else:
        # Fall back to Google Gemini
        g_key = key if key else (os.environ.get("GEMINI_API_KEY") or DEFAULT_GEMINI_KEY)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={g_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                **({"responseMimeType": "application/json"} if json_mode else {})
            },
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        logger.info("Calling Google Gemini with model=%s", model)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            raw_content = data["candidates"][0]["content"]["parts"][0]["text"]
            return clean_json_response(raw_content)
