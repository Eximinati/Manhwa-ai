from .celery_app import celery_app
import asyncio
import os
import json
import requests
import uuid
import io
import traceback
from pydub import AudioSegment
from supabase import create_client

# Import Utils
from .utils.supabase_utils import supabase_upload
from .utils.pdf_utils import extract_pdf_images_high_quality
from .utils.tts_utils import generate_narration_audio
from .utils.openai_utils import generate_full_script
from .config import TEMP_DIR, get_language_preset, DEFAULT_LANGUAGE

# -------------------------------------------------------------------
# 0. SETUP CLIENTS
# -------------------------------------------------------------------
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
)

# -------------------------------------------------------------------
# 1. HELPER FUNCTIONS
# -------------------------------------------------------------------

async def upload_images_parallel(image_bytes, manga_folder):
    semaphore = asyncio.Semaphore(5)
    image_urls = [None] * len(image_bytes)
    loop = asyncio.get_running_loop()

    async def _upload(img, idx):
        async with semaphore:
            path = f"{manga_folder}/images/page_{idx:02d}.jpg"
            url = await loop.run_in_executor(None, supabase_upload, img, path, "image/jpeg")
            return idx, url

    tasks = [_upload(b, i) for i, b in enumerate(image_bytes)]
    results = await asyncio.gather(*tasks)

    for idx, url in results:
        image_urls[idx] = url
    return image_urls

# -------------------------------------------------------------------
# 2. ASYNC LOGIC
# -------------------------------------------------------------------
async def _process_task_async(task_id, manga_name, manga_genre, pdf_url, manga_language=DEFAULT_LANGUAGE, reading_direction="right-to-left"):
    print(f"🚀 Starting Task: {task_id} | Manga: {manga_name} | Language: {manga_language} | Direction: {reading_direction}")
    voice = get_language_preset(manga_language)["voice"]
    
    try:
        # 1. Download PDF
        print("⬇️ Downloading PDF...")
        resp = requests.get(pdf_url)
        if resp.status_code != 200: raise ValueError("Failed to download PDF")

        temp_pdf = os.path.join(TEMP_DIR, f"{uuid.uuid4()}.pdf")
        with open(temp_pdf, "wb") as f:
            f.write(resp.content)

        # 2. Extract Images
        print("🖼️ Extracting Images...")
        images = extract_pdf_images_high_quality(temp_pdf)
        if not images: raise ValueError("No images extracted")

        image_bytes = []
        for img in images:
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=75, optimize=True)
            image_bytes.append(buf.getvalue())

        # 3. Upload Images
        str_id = str(task_id)
        manga_folder = f"{manga_name.replace(' ', '_').lower()}_{str_id[:8]}"
        image_urls = await upload_images_parallel(image_bytes, manga_folder)

        # 4. Generate Script (covers every panel, not just the first few)
        print("📝 Generating Script...")
        llm_output = generate_full_script(manga_name, manga_genre, manga_language, image_bytes, reading_direction)
        scenes = llm_output.get("scenes", [])

        # 5. Generate Audio
        print("🎤 Generating Audio...")
        merged_audio = AudioSegment.empty()
        final_scenes = []
        timeline = 0.0

        for sc in scenes:
            text = sc.get("narration_segment", "").strip()
            if text:
                path, dur = await generate_narration_audio(text, voice=voice)
                merged_audio += AudioSegment.from_mp3(path)
            else:
                dur = 2.0
                merged_audio += AudioSegment.silent(duration=2000)
            
            sc["start_time"] = round(timeline, 2)
            sc["duration"] = round(dur, 2)
            timeline += dur
            final_scenes.append(sc)

        # 6. Upload Audio
        buf = io.BytesIO()
        merged_audio.export(buf, format="mp3")
        audio_url = supabase_upload(buf.getvalue(), f"{manga_folder}/audio.mp3", "audio/mpeg")

        # 7. Save Result
        final_result = {
            "task_id": task_id,
            "status": "SUCCESS",
            "manga_name": manga_name,
            "image_urls": image_urls,
            "audio_url": audio_url,
            "final_video_segments": final_scenes,
            "total_duration": round(timeline, 2)
        }
        res_url = supabase_upload(json.dumps(final_result).encode(), f"{manga_folder}/result.json", "application/json")

        # 8. Update DB
        print("🔹 Updating Database...")
        supabase.table("jobs").update({
            "status": "SUCCESS",
            "result_url": res_url
        }).eq("id", task_id).execute()

        print("✅ Task Completed Successfully")
        return {"status": "ok"}

    except Exception as e:
        print(f"❌ Worker Failed: {e}")
        traceback.print_exc()
        if task_id:
            supabase.table("jobs").update({"status": "FAILED"}).eq("id", task_id).execute()
        raise e
    finally:
        if 'temp_pdf' in locals() and os.path.exists(temp_pdf):
            os.remove(temp_pdf)

# -------------------------------------------------------------------
# 3. CELERY TASK
# -------------------------------------------------------------------
@celery_app.task(bind=True, name="process_manga_pdf")
def process_manga_pdf_task(self, task_id, manga_name, manga_genre, pdf_url, manga_language=DEFAULT_LANGUAGE, reading_direction="right-to-left"):
    """
    Celery Wrapper: Runs the async logic in a sync loop
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(
            _process_task_async(task_id, manga_name, manga_genre, pdf_url, manga_language, reading_direction)
        )
    finally:
        loop.close()