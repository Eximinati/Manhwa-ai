import json
import base64
import logging

from app.config import get_language_preset, DEFAULT_LANGUAGE
from app.utils.groq_pool import call_with_rotation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("groq_utils")

MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

# Groq vision calls get slow/expensive (in tokens) past a handful of images
# per request, so a full chapter is narrated in small batches instead of
# truncating to the first few panels.
BATCH_SIZE = 4

# How much of the previous batch's narration to carry forward as context,
# so the story stays coherent across batches without the prompt growing
# with the length of the chapter.
CONTEXT_CHARS = 500


def _extract_json_from_text(raw: str):
    if not raw:
        return None
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1:
        return raw[start:end + 1]
    return None


def _fallback_batch_scenes(offset: int, count: int, manga_name: str):
    return [
        {
            "image_page_index": offset + i,
            "narration_segment": f"Scene {offset + i + 1} of {manga_name} chalta hai...",
        }
        for i in range(count)
    ]


def _generate_batch(manga_name, manga_genre, persona, story_so_far, batch_images, offset):
    """Narrate one batch of panels, continuing from `story_so_far`."""
    n = len(batch_images)

    prompt = f"""
    ROLE: {persona}
    TASK: Continue narrating a recap of "{manga_name}" ({manga_genre}).
    STORY SO FAR: {story_so_far or "(this is the beginning of the chapter)"}

    Narrate the next {n} manga panels shown below, in order, as a continuation
    of the story above. Keep energy high and make it flow as one continuous
    recap, not isolated captions.

    FORMAT: Respond with JSON ONLY, exactly this shape:
    {{
      "scenes": [
        {{ "image_page_index": 0, "narration_segment": "..." }},
        ... (must have exactly {n} items, indices 0..{n - 1} in order)
      ]
    }}
    """

    content_list = [{"type": "text", "text": prompt}]
    for i, img_bytes in enumerate(batch_images):
        b64 = base64.b64encode(img_bytes).decode("utf-8")
        content_list.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{b64}"}
        })
        content_list.append({"type": "text", "text": f"[Panel {i}]"})

    try:
        completion = call_with_rotation(
            lambda client: client.chat.completions.create(
                model=MODEL,
                messages=[{"role": "user", "content": content_list}],
                temperature=0.6,
                max_tokens=1500,
                response_format={"type": "json_object"},
            ),
            max_tokens_label=f"batch {offset}:{offset + n}",
        )

        raw = completion.choices[0].message.content
        json_str = _extract_json_from_text(raw)
        if not json_str:
            raise ValueError("No JSON found in Groq response")

        data = json.loads(json_str)
        scenes = data.get("scenes", [])
        if not scenes:
            raise ValueError("Empty scenes list from Groq")

        # Re-map local batch indices (0..n-1) to global panel indices,
        # and make sure every panel in this batch got a line.
        out = []
        for i in range(n):
            match = next((s for s in scenes if s.get("image_page_index") == i), None)
            if match and match.get("narration_segment", "").strip():
                out.append({
                    "image_page_index": offset + i,
                    "narration_segment": match["narration_segment"].strip(),
                })
            else:
                out.append(_fallback_batch_scenes(offset + i, 1, manga_name)[0])
        return out

    except Exception as e:
        logger.error(f"❌ Groq batch [{offset}:{offset + n}] failed: {e}")
        return _fallback_batch_scenes(offset, n, manga_name)


def generate_full_script(manga_name, manga_genre, language, image_bytes_list):
    """
    Narrates every panel in `image_bytes_list` (not just the first few),
    processing them in small batches so each Groq call stays cheap/fast,
    while carrying a short rolling summary forward so the recap reads as
    one continuous story instead of disconnected one-liners.
    """
    preset = get_language_preset(language or DEFAULT_LANGUAGE)
    persona = preset["persona"]

    total = len(image_bytes_list)
    logger.info(f"→ Narrating {total} panels in batches of {BATCH_SIZE} ({preset['label']}).")

    all_scenes = []
    story_so_far = ""

    for offset in range(0, total, BATCH_SIZE):
        batch = image_bytes_list[offset:offset + BATCH_SIZE]
        batch_scenes = _generate_batch(manga_name, manga_genre, persona, story_so_far, batch, offset)
        all_scenes.extend(batch_scenes)

        # Roll the context forward: keep it short so token usage doesn't
        # grow with chapter length.
        recap = " ".join(s["narration_segment"] for s in batch_scenes)
        story_so_far = (story_so_far + " " + recap).strip()[-CONTEXT_CHARS:]

    return {"scenes": all_scenes}


# Kept for direct single-image use (e.g. an emergency per-panel fallback
# outside the batched flow).
def generate_visual_description(image_bytes, language=DEFAULT_LANGUAGE):
    preset = get_language_preset(language)
    try:
        base64_image = base64.b64encode(image_bytes).decode("utf-8")
        prompt = f"{preset['persona']} Describe this single panel in 1 energetic sentence."

        chat_completion = call_with_rotation(
            lambda client: client.chat.completions.create(
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]
                }],
                model=MODEL,
                temperature=0.6,
                max_tokens=300,
            )
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"❌ Groq Vision Error: {e}")
        return "Scene aage badhta hai..."
