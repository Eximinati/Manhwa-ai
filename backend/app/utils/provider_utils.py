"""
Unified AI provider abstraction
--------------------------------
Routes vision LLM calls to Groq, Google AI Studio, or OpenRouter
based on `AI_PROVIDER` env var. Each provider's free tier is usable.

  AI_PROVIDER=groq       → uses GROQ_API_KEY(S)  (default)
  AI_PROVIDER=google     → uses GOOGLE_API_KEY   (Gemini 2.5 Flash)
  AI_PROVIDER=openrouter → uses OPENROUTER_API_KEY (free vision models)

Provider-specific env vars:
  GROQ_API_KEY / GROQ_API_KEYS   – Groq key(s), comma-separated
  GOOGLE_API_KEY                 – Google AI Studio key
  OPENROUTER_API_KEY             – OpenRouter key
  Provider model overrides:
  AI_MODEL                       – model name (provider default otherwise)
"""

import os
import io
import json
import base64
import logging
import time

logger = logging.getLogger("provider")

# ---------------------------------------------------------------------------
# Provider selection
# ---------------------------------------------------------------------------

class Provider:
    GROQ = "groq"
    GOOGLE = "google"
    OPENROUTER = "openrouter"

def get_provider() -> str:
    return os.environ.get("AI_PROVIDER", Provider.GROQ).strip().lower()

def get_model() -> str:
    return os.environ.get("AI_MODEL", "").strip()

# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _build_content(prompt: str, images: list) -> list:
    """Build content list for OpenAI-compatible APIs (Groq, OpenRouter)."""
    content = [{"type": "text", "text": prompt}]
    for i, img_bytes in enumerate(images):
        b64 = base64.b64encode(img_bytes).decode("utf-8")
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{b64}"}
        })
        content.append({"type": "text", "text": f"[Panel {i}]"})
    return content


def _extract_json_from_text(raw: str):
    if not raw:
        return None
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1:
        return raw[start:end + 1]
    return None

# ---------------------------------------------------------------------------
# Groq
# ---------------------------------------------------------------------------

from app.utils.groq_pool import call_with_rotation

GROQ_DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

def _groq_vision(prompt, images, model, temperature, max_tokens, json_output, label):
    content = _build_content(prompt, images)
    model_name = model or get_model() or GROQ_DEFAULT_MODEL
    fmt = {"type": "json_object"} if json_output else None

    completion = call_with_rotation(
        lambda client: client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": content}],
            temperature=temperature,
            max_tokens=max_tokens,
            response_format=fmt,
        ),
        max_tokens_label=label,
    )
    return completion.choices[0].message.content

# ---------------------------------------------------------------------------
# Google AI Studio (Gemini)
# ---------------------------------------------------------------------------

GOOGLE_DEFAULT_MODEL = "gemini-2.5-flash-001"

def _google_vision(prompt, images, model, temperature, max_tokens, json_output, label):
    try:
        import google.generativeai as genai
    except ImportError:
        raise RuntimeError("google-generativeai not installed. Run: pip install google-generativeai")

    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY not set")

    genai.configure(api_key=api_key)
    model_name = model or get_model() or GOOGLE_DEFAULT_MODEL
    gemini_model = genai.GenerativeModel(model_name)

    contents = [prompt]
    for img_bytes in images:
        contents.append({"mime_type": "image/jpeg", "data": img_bytes})

    gen_config = {
        "temperature": temperature,
        "max_output_tokens": max_tokens,
    }
    if json_output:
        gen_config["response_mime_type"] = "application/json"

    response = gemini_model.generate_content(
        contents,
        generation_config=gen_config,
    )

    if not response.candidates:
        raise RuntimeError(f"Gemini returned no candidates: {response.prompt_feedback}")

    return response.text

# ---------------------------------------------------------------------------
# OpenRouter (OpenAI-compatible)
# ---------------------------------------------------------------------------

OPENROUTER_DEFAULT_MODEL = "google/gemini-2.5-flash-001"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

def _openrouter_vision(prompt, images, model, temperature, max_tokens, json_output, label):
    try:
        from openai import OpenAI
    except ImportError:
        raise RuntimeError("openai not installed. Run: pip install openai")

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY not set")

    client = OpenAI(api_key=api_key, base_url=OPENROUTER_BASE_URL)
    content = _build_content(prompt, images)
    model_name = model or get_model() or OPENROUTER_DEFAULT_MODEL

    kwargs = {
        "model": model_name,
        "messages": [{"role": "user", "content": content}],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "extra_headers": {
            "HTTP-Referer": "https://manhwa-ai.app",
            "X-Title": "Manhwa AI",
        },
    }

    # Some OpenRouter models support json_object, some don't
    if json_output:
        try:
            kwargs["response_format"] = {"type": "json_object"}
        except Exception:
            pass

    completion = client.chat.completions.create(**kwargs)
    return completion.choices[0].message.content

# ---------------------------------------------------------------------------
# Unified entry point
# ---------------------------------------------------------------------------

def call_vision(prompt, images, model=None, temperature=0.6, max_tokens=1500, json_output=False, label=""):
    """
    Call the configured provider's vision model.

    Args:
        prompt:       Text prompt string
        images:       List of image bytes (JPEG)
        model:        Override model name (None = provider default)
        temperature:  Sampling temperature (0-1)
        max_tokens:   Max output tokens
        json_output:  Request JSON response format
        label:        Log label

    Returns:
        Raw response text string
    """
    provider = get_provider()
    logger.info(f"→ {provider} vision call ({label or 'unnamed'}) — {len(images)} image(s)")

    start = time.time()

    if provider == Provider.GROQ:
        text = _groq_vision(prompt, images, model, temperature, max_tokens, json_output, label)
    elif provider == Provider.GOOGLE:
        text = _google_vision(prompt, images, model, temperature, max_tokens, json_output, label)
    elif provider == Provider.OPENROUTER:
        text = _openrouter_vision(prompt, images, model, temperature, max_tokens, json_output, label)
    else:
        raise ValueError(f"Unknown AI_PROVIDER: {provider} (use: groq / google / openrouter)")

    elapsed = time.time() - start
    logger.info(f"✔ {provider} responded in {elapsed:.1f}s ({len(text)} chars)")
    return text


def call_vision_json(prompt, images, model=None, temperature=0.6, max_tokens=1500, label=""):
    """
    Like call_vision but expects JSON output, auto-extracts and parses it.
    Returns the parsed JSON dict, or None on failure.
    """
    text = call_vision(
        prompt=prompt,
        images=images,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        json_output=True,
        label=label,
    )
    json_str = _extract_json_from_text(text)
    if not json_str:
        logger.error(f"❌ No JSON found in response for {label}")
        return None
    return json.loads(json_str)
