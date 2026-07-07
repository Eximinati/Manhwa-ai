import os
import random
import asyncio
from fastapi import FastAPI, Form, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from celery.result import AsyncResult

# Import Celery stuff
from app.celery_app import celery_app
from app.worker import process_manga_pdf_task

from app.utils.supabase_utils import supabase_upload
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

@app.post("/api/v1/generate_audio_story")
async def start_generation(
    manga_name: str = Form(...),
    manga_genre: str = Form(...),
    manga_pdf: UploadFile = File(...),
    manga_language: str = Form(DEFAULT_LANGUAGE),
    reading_direction: str = Form("right-to-left"),
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
            args=[task_id, manga_name, manga_genre, pdf_url, manga_language, reading_direction],
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