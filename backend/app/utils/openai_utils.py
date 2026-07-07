"""
Script generation powered by the configured AI provider.
All vision API calls go through provider_utils which routes to
Groq / Google AI Studio / OpenRouter based on AI_PROVIDER.
"""

import json
import logging

from app.config import get_language_preset, DEFAULT_LANGUAGE
from app.utils.provider_utils import call_vision, call_vision_json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("script_gen")

BATCH_SIZE = 4
CONTEXT_CHARS = 500


def _fallback_batch_scenes(offset: int, count: int, manga_name: str):
    return [
        {
            "image_page_index": offset + i,
            "narration_segment": f"Scene {offset + i + 1} of {manga_name} chalta hai...",
        }
        for i in range(count)
    ]


def _generate_batch(manga_name, manga_genre, persona, story_so_far, batch_images, offset, reading_direction="right-to-left", custom_instructions="", style_guideline=""):
    """Narrate one batch of panels. Non-story panels are auto-skipped."""
    n = len(batch_images)

    reading_hint = {
        "right-to-left": "IMPORTANT: This is manga — panels read RIGHT-TO-LEFT, top-to-bottom.",
        "left-to-right": "IMPORTANT: This is manhwa/manhua — panels read LEFT-TO-RIGHT, top-to-bottom.",
        "vertical": "Panels read TOP-TO-BOTTOM only (webtoon style).",
    }.get(reading_direction, "Panels read RIGHT-TO-LEFT (manga).")

    style_block = f"\nUSER STYLE REQUEST: {custom_instructions}\n" if custom_instructions else ""
    guideline_block = f"\nSTYLE GUIDELINE (follow this writing style):\n{style_guideline}\n" if style_guideline else ""

    prompt = f"""
    ROLE: {persona}
    TASK: Continue narrating a recap of "{manga_name}" ({manga_genre}).
    STORY SO FAR: {story_so_far or "(this is the beginning of the chapter)"}

    {reading_hint}
    {style_block}
    {guideline_block}
    You will be shown {n} manga panels below.

    RULES:
    1. Identify which panels are STORY CONTENT (actual manga panels with narrative elements).
    2. SKIP non-story panels: title pages, chapter covers, advertisements, credits pages,
       volume banners, recap pages, or any page without narrative progression.
    3. Only narrate the story panels. Non-story panels are omitted entirely.
    4. Narrate in order, as a continuation of the story above. Keep energy high
       and make it flow as one continuous recap, not isolated captions.

    FORMAT: Respond with JSON ONLY, exactly this shape:
    {{{{
      "scenes": [
        {{ "image_page_index": 0, "narration_segment": "..." }},
        ... (only include story panels — may be fewer than {n})
      ]
    }}}}

    The "image_page_index" refers to the panel number shown (0, 1, 2, ... {n - 1}).
    Only include entries for panels that contain story content worthy of narration.
    """

    try:
        data = call_vision_json(
            prompt=prompt,
            images=batch_images,
            temperature=0.6,
            max_tokens=1500,
            label=f"batch {offset}:{offset + n}",
        )

        if not data:
            raise ValueError("Empty or invalid JSON from provider")

        scenes = data.get("scenes", [])

        out = []
        skipped = 0
        for scene in scenes:
            local_idx = scene.get("image_page_index")
            if local_idx is not None and 0 <= local_idx < n:
                text = scene.get("narration_segment", "").strip()
                if text:
                    out.append({
                        "image_page_index": offset + local_idx,
                        "narration_segment": text,
                    })
                else:
                    skipped += 1
            else:
                skipped += 1

        if not out:
            logger.warning(f"⚠ Batch [{offset}:{offset+n}] returned 0 story panels — fallback")
            return _fallback_batch_scenes(offset, n, manga_name)

        logger.info(f"✔ Batch [{offset}:{offset+n}] → {len(out)} story panels, {skipped} skipped")
        return out

    except Exception as e:
        logger.error(f"❌ Batch [{offset}:{offset + n}] failed: {e}")
        return _fallback_batch_scenes(offset, n, manga_name)


def analyze_script_style(example_images, example_script, language):
    """Analyze example manga images + script to produce a style guideline."""
    preset = get_language_preset(language or DEFAULT_LANGUAGE)

    if example_images:
        prompt = f"""
    ROLE: {preset['persona']}
    TASK: Analyze the writing style of the example manga narration below.

    You will be shown {len(example_images)} manga panel images and the
    corresponding narration script written for those panels.

    Analyze these aspects of the writing style:
    - TONE (dramatic, humorous, dark, casual)
    - SENTENCE STRUCTURE (short/punchy or long/flowing)
    - VOCABULARY (simple vs complex, genre-specific terms)
    - PACING (fast action, slow descriptive)
    - PERSPECTIVE (omniscient, character-focused)
    - CHARACTER VOICE (how characters are described/referenced)
    - EMOTIONAL QUALITY (hype, melancholy, neutral)

    EXAMPLE NARRATION SCRIPT:
    {example_script}

    Return a concise, actionable style guideline that another AI could follow
    to write in the same style. Be specific.

    FORMAT: Respond with JSON ONLY:
    {{{{
      "guideline": "... detailed style analysis ..."
    }}}}
    """
        images = example_images[:BATCH_SIZE]
    else:
        prompt = f"""
    ROLE: {preset['persona']}
    TASK: Analyze the writing style of the example narration script below.

    Describe the style in terms of tone, sentence structure, vocabulary,
    pacing, perspective, and emotional quality.

    EXAMPLE NARRATION SCRIPT:
    {example_script}

    Return a concise, actionable style guideline.

    FORMAT: Respond with JSON ONLY:
    {{{{
      "guideline": "... style analysis ..."
    }}}}
    """
        images = []

    try:
        data = call_vision_json(
            prompt=prompt,
            images=images,
            temperature=0.4,
            max_tokens=2000,
            label="style_analysis",
        )

        if data and data.get("guideline", "").strip():
            guideline = data["guideline"].strip()
            logger.info("✔ Style analysis complete")
            return guideline

        raise ValueError("Empty guideline from model")

    except Exception as e:
        logger.error(f"❌ Style analysis failed: {e}")
        return ""


def generate_full_script(manga_name, manga_genre, language, image_bytes_list, reading_direction="right-to-left", custom_instructions="", style_guideline=""):
    """
    Narrates every panel in small batches. Non-story panels
    (ads, banners, title pages) are auto-skipped.
    """
    preset = get_language_preset(language or DEFAULT_LANGUAGE)
    persona = preset["persona"]

    total = len(image_bytes_list)
    logger.info(f"→ Narrating {total} panels in batches of {BATCH_SIZE} ({preset['label']}). Auto-skip enabled.")

    all_scenes = []
    story_so_far = ""

    for offset in range(0, total, BATCH_SIZE):
        batch = image_bytes_list[offset:offset + BATCH_SIZE]
        batch_scenes = _generate_batch(
            manga_name, manga_genre, persona, story_so_far, batch, offset,
            reading_direction, custom_instructions, style_guideline
        )
        all_scenes.extend(batch_scenes)

        recap = " ".join(s["narration_segment"] for s in batch_scenes)
        story_so_far = (story_so_far + " " + recap).strip()[-CONTEXT_CHARS:]

    logger.info(f"✔ Total: {len(all_scenes)} story panels (out of {total} input panels)")
    return {"scenes": all_scenes}


def generate_visual_description(image_bytes, language=DEFAULT_LANGUAGE):
    """Single-image description (fallback/utility)."""
    preset = get_language_preset(language)
    prompt = f"{preset['persona']} Describe this single panel in 1 energetic sentence."

    try:
        text = call_vision(
            prompt=prompt,
            images=[image_bytes],
            temperature=0.6,
            max_tokens=300,
            label="visual_desc",
        )
        return text.strip()
    except Exception as e:
        logger.error(f"❌ Visual description failed: {e}")
        return "Scene aage badhta hai..."
