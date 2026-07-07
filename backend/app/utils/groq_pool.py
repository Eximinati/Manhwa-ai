"""
Groq API key pool
-----------------
Groq's free tier limits requests-per-minute and requests-per-day *per key*.
Since script generation now calls Groq once per panel batch instead of
once per chapter, a long manga chapter can burn through a single free
key's daily limit. Each Groq account (one per email/Google account) gets
its own independent free-tier quota, so spreading calls across several
keys multiplies the effective free capacity.

Set GROQ_API_KEYS to a comma-separated list of keys (one per Groq
account). GROQ_API_KEY (singular) still works as a single-key fallback.
"""

import os
import logging
import itertools
import threading
from groq import Groq

logger = logging.getLogger("groq_pool")


def _load_keys():
    raw = os.environ.get("GROQ_API_KEYS") or os.environ.get("GROQ_API_KEY", "")
    keys = [k.strip() for k in raw.split(",") if k.strip()]
    if not keys:
        logger.warning("⚠️ No GROQ_API_KEY(S) configured — Groq calls will fail.")
    else:
        logger.info(f"🔑 Loaded {len(keys)} Groq API key(s) for rotation.")
    return keys


GROQ_KEYS = _load_keys()

_lock = threading.Lock()
_cycle = itertools.cycle(GROQ_KEYS) if GROQ_KEYS else None
_clients = {}


def _next_client():
    with _lock:
        key = next(_cycle)
    client = _clients.get(key)
    if client is None:
        client = Groq(api_key=key)
        _clients[key] = client
    return client


def _is_rate_limit_error(err: Exception) -> bool:
    msg = str(err).lower()
    return "rate limit" in msg or "429" in msg or "quota" in msg or "too many requests" in msg


def call_with_rotation(request_fn, max_tokens_label=""):
    """
    Calls `request_fn(client)` using the next key in the pool. If the key
    is rate-limited, rotates to the next one and retries, up to one pass
    over every configured key.
    """
    if not GROQ_KEYS:
        raise RuntimeError("No GROQ_API_KEY(S) configured in environment.")

    last_err = None
    for attempt in range(len(GROQ_KEYS)):
        client = _next_client()
        try:
            return request_fn(client)
        except Exception as e:
            last_err = e
            if _is_rate_limit_error(e):
                logger.warning(
                    f"⚠️ Groq key #{attempt + 1}/{len(GROQ_KEYS)} rate-limited{' (' + max_tokens_label + ')' if max_tokens_label else ''}, rotating..."
                )
                continue
            raise

    raise last_err
