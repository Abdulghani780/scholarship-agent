"""
Universal LLM Client Supporting OpenRouter, Local AI Gateway, and Google Gemini
================================================================================
Handles structured JSON responses, clean Markdown stripping,
and a 3-tier resilient fallback cascade to ensure 100% live uptime.
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
LOCAL_GATEWAY_URL = os.environ.get("LOCAL_AI_GATEWAY", "http://127.0.0.1:20128/v1/chat/completions")
LOCAL_GATEWAY_KEY = os.environ.get("OMNIROUTE_API_KEY", "sk-5706bd0c43e85ba6-1cbf7f-c4c65b53")


def clean_json_response(raw_text: str) -> str:
    """Strip markdown fences (```json ... ```) and whitespace from response."""
    text = raw_text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


def _call_openrouter_official(
    prompt: str,
    model: str,
    key: str,
    json_mode: bool,
    temperature: float,
    timeout: int,
) -> str:
    """Call official OpenRouter API at openrouter.ai."""
    url = "https://openrouter.ai/api/v1/chat/completions"
    payload: dict[str, Any] = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    headers = {
        "Authorization": f"Bearer {key}",
        "HTTP-Referer": "http://localhost:5174",
        "X-Title": "Scholarship Matcher & Planner Agent",
        "Content-Type": "application/json",
        "User-Agent": "ScholarshipAgent/1.0",
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return clean_json_response(data["choices"][0]["message"]["content"])


def _call_local_gateway(
    prompt: str,
    model: str,
    json_mode: bool,
    temperature: float,
    timeout: int,
) -> str:
    """Call local OpenRouter/OmniRoute gateway on port 20128."""
    target_model = model
    # If the model is an openrouter/ or :free model, try it first, or use the fast active gateway model
    if not model or model == "default" or "gemini" in model:
        target_model = "antigravity/gemini-3-flash"
    elif "auto" not in model and "/" not in model:
        target_model = "antigravity/gemini-3-flash"

    payload: dict[str, Any] = {
        "model": target_model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    headers = {
        "Authorization": f"Bearer {LOCAL_GATEWAY_KEY}",
        "Content-Type": "application/json",
    }
    req = urllib.request.Request(
        LOCAL_GATEWAY_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return clean_json_response(data["choices"][0]["message"]["content"])


def _call_gemini_direct(
    prompt: str,
    model: str,
    key: str,
    json_mode: bool,
    temperature: float,
    timeout: int,
) -> str:
    """Call Google Gemini API directly."""
    g_model = "gemini-2.5-flash" if ("/" in model or ":free" in model) else model
    g_key = key if (key and not key.startswith("sk-")) else DEFAULT_GEMINI_KEY
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{g_model}:generateContent?key={g_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            **({"responseMimeType": "application/json"} if json_mode else {}),
        },
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return clean_json_response(data["candidates"][0]["content"]["parts"][0]["text"])


def call_llm(
    prompt: str,
    model_name: str | None = None,
    api_key: str | None = None,
    json_mode: bool = True,
    temperature: float = 0.2,
    timeout: int = 30,
) -> str:
    """
    Call LLM with a 3-tier resilient cascade:
    1. If a valid OpenRouter API key (sk-or-...) is present, call official OpenRouter.
    2. Try the local high-speed AI Gateway (port 20128) which routes through OpenRouter/models.
    3. Fall back to Google Gemini Cloud API.
    """
    model = (model_name or DEFAULT_MODEL).strip()
    key = (api_key or "").strip()
    or_env_key = os.environ.get("OPENROUTER_API_KEY", "")

    # Tier 1: User explicitly supplied an OpenRouter key
    if key.startswith("sk-or-") or or_env_key.startswith("sk-or-"):
        active_key = key if key.startswith("sk-or-") else or_env_key
        try:
            logger.info("Tier 1: Calling official OpenRouter with model=%s", model)
            return _call_openrouter_official(
                prompt=prompt,
                model=model,
                key=active_key,
                json_mode=json_mode,
                temperature=temperature,
                timeout=timeout,
            )
        except Exception as e:
            logger.warning("Official OpenRouter failed (%s). Falling to Tier 2 gateway.", e)

    # Tier 2: Try Local AI Gateway (port 20128)
    try:
        logger.info("Tier 2: Calling local AI Gateway on port 20128 with model=%s", model)
        return _call_local_gateway(
            prompt=prompt,
            model=model,
            json_mode=json_mode,
            temperature=temperature,
            timeout=12,
        )
    except Exception as e:
        logger.warning("Local AI Gateway failed (%s). Falling to Tier 3 Google Gemini.", e)

    # Tier 3: Direct Google Gemini API
    logger.info("Tier 3: Calling direct Google Gemini with model=%s", model)
    return _call_gemini_direct(
        prompt=prompt,
        model=model,
        key=key,
        json_mode=json_mode,
        temperature=temperature,
        timeout=timeout,
    )
