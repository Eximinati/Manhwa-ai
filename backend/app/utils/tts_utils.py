"""
Ultra-Stable Neural TTS Generator (Edge-TTS)
---------------------------------------------------------
Optimized for:
 - Natural Human-like Voices (Microsoft Edge Neural)
 - Hinglish Support (hi-IN-MadhurNeural)
 - Async Execution
 - Accurate Duration Calculation
"""

import os
import hashlib
import shutil
import edge_tts
from pydub import AudioSegment
from app.config import TTS_CACHE_DIR, DEFAULT_LANGUAGE, get_language_preset

# ============================================================
# CONFIGURATION
# ============================================================
# Default voice used when no language/voice is specified.
VOICE = get_language_preset(DEFAULT_LANGUAGE)["voice"]

# ============================================================
# 1. FFmpeg Safety Check
# ============================================================
def _assert_ffmpeg_exists():
    if not shutil.which("ffmpeg"):
        raise EnvironmentError("❌ FFmpeg not found! Please install it.")

# ============================================================
# 2. Get Audio Duration Safely
# ============================================================
def _duration(path: str) -> float:
    try:
        audio = AudioSegment.from_mp3(path)
        return round(len(audio) / 1000, 2)
    except:
        return 0.0

# ============================================================
# 3. MAIN FUNCTION — Neural TTS (Async)
# ============================================================
async def generate_narration_audio(text: str, voice: str = VOICE) -> tuple[str, float]:
    """
    Generates high-quality Neural audio.
    NOTE: This is now an ASYNC function.
    """
    _assert_ffmpeg_exists()
    os.makedirs(TTS_CACHE_DIR, exist_ok=True)

    # Clean text
    clean_text = " ".join(text.split()).strip()
    if not clean_text:
        return "", 0.0

    # Cache Key (voice included so the same line in different voices
    # doesn't collide on a single cached file)
    text_hash = hashlib.md5(f"{voice}:{clean_text}".encode()).hexdigest()
    final_path = os.path.join(TTS_CACHE_DIR, f"{text_hash}.mp3")

    # ------------------------------------------------------------
    # CHECK CACHE
    # ------------------------------------------------------------
    if os.path.exists(final_path):
        dur = _duration(final_path)
        if dur > 0.2:
            print(f"✔ Cached Neural Audio ({dur}s)")
            return final_path, dur
        else:
            try:
                os.remove(final_path)
            except:
                pass

    # ------------------------------------------------------------
    # GENERATE NEW AUDIO (Edge TTS)
    # ------------------------------------------------------------
    print(f"🎤 Generating Neural TTS ({len(clean_text)} chars)...")
    
    try:
        communicate = edge_tts.Communicate(clean_text, voice)
        await communicate.save(final_path)

        dur = _duration(final_path)
        print(f"✔ Final TTS generated → {dur}s")
        return final_path, dur

    except Exception as e:
        print(f"❌ EdgeTTS Failed: {e}")
        # Fallback to silence if generation fails
        fallback = os.path.join(TTS_CACHE_DIR, f"{text_hash}_fallback.mp3")
        AudioSegment.silent(duration=1000).export(fallback, format="mp3")
        return fallback, 1.0