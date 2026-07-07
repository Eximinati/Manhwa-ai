import os
import random
import asyncio
import io
import json
import base64
import uuid
import traceback
from fastapi import FastAPI, Form, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from celery.result import AsyncResult

# Import Celery stuff
from app.celery_app import celery_app
from app.worker import process_manga_pdf_task

from app.utils.supabase_utils import supabase_upload
from app.utils.pdf_utils import extract_pdf_images_high_quality
from app.utils.openai_utils import analyze_script_style
from app.config import NARRATION_LANGUAGES, DEFAULT_LANGUAGE
from supabase import create_client

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.get("/")
def home():
    return {"status": "Manhwa AI Running on Hugging Face (RabbitMQ + Redis)"}

@app.get("/api/v1/languages")
def list_languages():
    return {
        key: {"label": preset["label"]}
        for key, preset in NARRATION_LANGUAGES.items()
    }

@app.post("/api/v1/analyze_style")
async def analyze_style(
    example_pdf: UploadFile = File(None),
    example_script: str = Form(""),
    language: str = Form(DEFAULT_LANGUAGE),
):
    """
    Accept an optional example PDF (1-4 pages) + the corresponding narration
    script text. Uses Groq vision to analyze the writing style and returns
    a natural-language style guideline.
    """
    try:
        if language not in NARRATION_LANGUAGES:
            language = DEFAULT_LANGUAGE

        example_images = []

        if example_pdf:
            file_bytes = await example_pdf.read()
            temp_pdf = os.path.join("/tmp", f"style_{uuid.uuid4()}.pdf")
            with open(temp_pdf, "wb") as f:
                f.write(file_bytes)

            images = extract_pdf_images_high_quality(temp_pdf, max_pages=4)
            for img in images:
                buf = io.BytesIO()
                img.save(buf, format="JPEG", quality=75, optimize=True)
                example_images.append(buf.getvalue())

            if os.path.exists(temp_pdf):
                os.remove(temp_pdf)

        if not example_images:
            # No PDF — just analyze the script text alone for style
            example_images = []

        guideline = analyze_script_style(example_images, example_script, language)
        if not guideline:
            guideline = "No style guideline could be generated from the provided example."

        return {"guideline": guideline}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/generate_audio_story")
async def start_generation(
    manga_name: str = Form(...),
    manga_genre: str = Form(...),
    manga_pdf: UploadFile = File(...),
    manga_language: str = Form(DEFAULT_LANGUAGE),
    reading_direction: str = Form("right-to-left"),
    custom_instructions: str = Form(""),
    style_guideline: str = Form(""),
    user_id: str = Form("")
):
    try:
        if manga_language not in NARRATION_LANGUAGES:
            manga_language = DEFAULT_LANGUAGE

        task_id = str(random.getrandbits(63))

        file_bytes = await manga_pdf.read()
        unique_filename = f"uploads/{task_id}_{manga_name[:10].replace(' ', '_')}.pdf"
        pdf_url = supabase_upload(file_bytes, unique_filename, "application/pdf")

        supabase.table("jobs").insert({
            "id": task_id,
            "status": "QUEUED",
            "manga_name": manga_name,
            "manga_genre": manga_genre,
            "manga_language": manga_language,
            "reading_direction": reading_direction,
            "user_id": user_id or None,
            "pdf_url": pdf_url,
            "created_at": "now()"
        }).execute()

        process_manga_pdf_task.apply_async(
            args=[task_id, manga_name, manga_genre, pdf_url, manga_language, reading_direction, custom_instructions, style_guideline],
            task_id=task_id
        )

        return {"task_id": task_id, "status": "QUEUED"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/jobs")
def list_jobs(user_id: str = "", limit: int = 20, offset: int = 0):
    if not user_id:
        return {"jobs": []}
    res = supabase.table("jobs").select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .range(offset, offset + limit - 1)\
        .execute()
    return {"jobs": res.data or []}

@app.get("/api/v1/status/{task_id}")
def get_status(task_id: str):
    # Optimization: Check Redis first for active status
    task_result = AsyncResult(task_id, app=celery_app)
    
    if task_result.state in ['PENDING', 'STARTED', 'RETRY']:
        return {"task_id": task_id, "state": "PROCESSING", "progress": 50}
    
    # Fallback to Supabase for final result
    res = supabase.table("jobs").select("*").eq("id", task_id).execute()
    if not res.data: raise HTTPException(404, "Task not found")
    rec = res.data[0]
    
    return {
        "task_id": str(rec["id"]),
        "state": rec["status"],
        "result": rec.get("result_url")
    }
