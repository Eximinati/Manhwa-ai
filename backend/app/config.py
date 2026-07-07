import os
import platform
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

# -----------------------------
# 1. STORAGE PATH SETUP (The Universal Fix ⚡)
# -----------------------------
# Detect OS: 'Windows' (Local) vs 'Linux' (Hugging Face / AWS / GCP)
SYSTEM_OS = platform.system()

if SYSTEM_OS == "Windows":
    # 💻 LOCAL WINDOWS: Use the project folder so you can see the files
    BASE_DIR = os.getcwd()
    print(f"💻 Running Locally (Windows): Using {BASE_DIR} for storage")
else:
    # ☁️ CLOUD (Linux): Always use /tmp (Safe for HF, AWS Lambda, GCP)
    BASE_DIR = "/tmp"
    print(f"🚀 Running on Server (Linux): Using /tmp for storage")

# Define paths
TTS_CACHE_DIR = os.path.join(BASE_DIR, "tts_cache")
TEMP_DIR = os.path.join(BASE_DIR, "temp")

# Create directories immediately
os.makedirs(TTS_CACHE_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

# -----------------------------
# 2. AI PROVIDER SELECTION
# -----------------------------
# AI_PROVIDER = groq | google | openrouter
# Each provider has its own free tier. See provider_utils.py for details.
AI_PROVIDER = os.getenv("AI_PROVIDER", "groq")
if AI_PROVIDER not in ("groq", "google", "openrouter"):
    print(f"⚠️ Unknown AI_PROVIDER '{AI_PROVIDER}', falling back to 'groq'")
    AI_PROVIDER = "groq"

# -----------------------------
# 3. GROQ API KEY(S)
# -----------------------------
# GROQ_API_KEYS (comma-separated, one key per Groq account) is preferred —
# it lets app.utils.groq_pool rotate across multiple free-tier accounts to
# multiply the effective rate limit. GROQ_API_KEY (singular) still works
# as a single-key fallback. See app/utils/groq_pool.py for the pool itself.
if not os.getenv("GROQ_API_KEYS") and not os.getenv("GROQ_API_KEY"):
    print("⚠️ WARNING: Neither GROQ_API_KEYS nor GROQ_API_KEY is set.")

# -----------------------------
# 3. SUPABASE CONFIG
# -----------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "manhwa-content")

if not SUPABASE_URL or not SUPABASE_KEY:
    # Don't crash immediately on import, but warn loudly
    print("❌ CRITICAL: Missing SUPABASE_URL or SUPABASE_KEY in env vars.")

# -----------------------------
# 4. NARRATION LANGUAGE / VOICE PRESETS
# -----------------------------
# Each preset pairs a free edge-tts voice with a matching narrator persona
# used to prompt the LLM. Add new entries here to support more languages.
DEFAULT_LANGUAGE = "hinglish"

NARRATION_LANGUAGES = {
    "hinglish": {
        "label": "Hinglish (Hindi + English)",
        "voice": "hi-IN-MadhurNeural",
        "persona": (
            "You are 'Manga-Bhai', a high-energy Indian YouTuber. "
            "Narrate in Hinglish (mix of Hindi and English, written in Roman script)."
        ),
    },
    "hindi": {
        "label": "Hindi",
        "voice": "hi-IN-MadhurNeural",
        "persona": (
            "You are 'Manga-Bhai', a high-energy Indian YouTuber. "
            "Narrate purely in Hindi (Devanagari script)."
        ),
    },
    "english": {
        "label": "English",
        "voice": "en-US-ChristopherNeural",
        "persona": (
            "You are a high-energy YouTube narrator specializing in dramatic manga/manhwa recaps. "
            "Narrate in engaging, cinematic English."
        ),
    },
}


def get_language_preset(language: str) -> dict:
    return NARRATION_LANGUAGES.get(language, NARRATION_LANGUAGES[DEFAULT_LANGUAGE])