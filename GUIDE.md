# Manhwa.AI — Setup & Usage Guide

End-to-end guide to get this running from zero and turn a manga/manhwa/manhua PDF into a narrated recap video, entirely on free tiers.

---

## 1. What this actually does

```
Upload PDF → extract panels → Groq LLM writes a narrated recap script
    → edge-tts turns it into audio → your browser renders the final MP4
```

Two very different halves:

- **Backend (Python/FastAPI + Celery)**: extracts manga panels from the PDF, generates narration text with a free vision-LLM (Groq, model `meta-llama/llama-4-scout-17b-16e-instruct`), turns that narration into speech (edge-tts, free Microsoft Neural voices), and hands the frontend a JSON payload of image URLs + audio + per-panel timing.
- **Frontend (React)**: takes that JSON and **renders the actual video file in your browser** — no server-side video rendering, no ffmpeg on the backend.

## 2. What generates the video (specifically)

Not FFmpeg, not FFmpeg.wasm (older README claimed this — it's outdated). It's:

- **[`WebCodecs API`](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)** — a native browser API (Chrome/Edge/other Chromium browsers) that gives JavaScript direct access to the browser's hardware/software H.264 video encoder and AAC audio encoder. This is what actually compresses each frame and the audio track.
- **[`mp4-muxer`](https://www.npmjs.com/package/mp4-muxer)** — a small JS library that takes the encoded video/audio chunks from WebCodecs and packages them into a valid `.mp4` container file.
- Frame-by-frame, the code (`frontend/src/utils/videoMaker.js`) draws each panel onto an `OffscreenCanvas` with a pan or zoom animation, feeds that canvas to `VideoEncoder`, and does the same for the narration audio via `AudioEncoder`.

Practical implications:
- Needs a **Chromium-based browser** (Chrome, Edge, Brave, Opera). Firefox/Safari don't fully support `VideoEncoder`/`AudioEncoder` yet.
- Video rendering cost is **zero** on your server — it happens on whoever's browser clicks "Generate Video" (assumed to be you).
- Two output formats are supported: vertical 720×1280 (Shorts/Reels) and horizontal 1280×720 (long-form).

## 3. Accounts you need for LOCAL-ONLY use

This guide assumes you're running everything on your own machine, no Docker, no public hosting. That means **Hugging Face Spaces, CloudAMQP, Upstash, Vercel, and Google Cloud Run are all skippable.** They only matter if you later want this reachable from outside your machine (see §10).

What you actually still need accounts for, because these are AI/storage services the app talks to over the internet, not hosting platforms:

| Service | Used for | Free tier |
|---|---|---|
| [Supabase](https://supabase.com) | Storage for uploaded PDFs, extracted panel images, audio, and result JSON | Yes — 1GB storage free |
| [Groq](https://console.groq.com) | LLM script generation + vision captions | Yes — rate-limited per account (see §6) |

Everything else runs as software installed directly on your PC — see §4.

---

## 4. Software to install on your PC

No Docker needed. Five things, in order:

### 4.1 Python (3.10 or newer)

You likely already have this. Check: `python --version`. If not, get it from [python.org/downloads](https://www.python.org/downloads/) — during install, tick **"Add python.exe to PATH"**.

### 4.2 Node.js (18+)

Check: `node --version`. If missing, get the LTS installer from [nodejs.org](https://nodejs.org/).

### 4.3 Redis for Windows (the Celery job queue)

Redis itself doesn't officially ship for Windows, so use one of these (either is free, pick one):

- **Memurai Developer** (recommended, easiest) — [memurai.com/get-memurai](https://www.memurai.com/get-memurai). Free edition, MSI installer, installs as a Windows service, starts automatically, listens on `localhost:6379` — nothing else to configure.
- **tporadowski/redis** (portable, no install) — download the latest zip from [github.com/tporadowski/redis/releases](https://github.com/tporadowski/redis/releases), extract it anywhere, and run `redis-server.exe` from that folder whenever you want to use the app (keep that window open while the backend runs).

Verify it's listening: open a new terminal and run `redis-cli ping` (Memurai) or, from the extracted folder, `redis-cli.exe ping` (tporadowski) — should print `PONG`.

### 4.4 FFmpeg (audio processing)

1. Download a Windows build from [gyan.dev/ffmpeg/builds](https://www.gyan.dev/ffmpeg/builds/) (the "essentials" build is enough).
2. Extract it, e.g. to `C:\ffmpeg`.
3. Add `C:\ffmpeg\bin` to your PATH: Windows Search → "Edit the system environment variables" → Environment Variables → under "User variables", select `Path` → Edit → New → paste `C:\ffmpeg\bin` → OK everything.
4. Open a **new** terminal and verify: `ffmpeg -version`.

### 4.5 Poppler (PDF → image conversion)

1. Download the latest Windows release from [github.com/oschwartz10612/poppler-windows/releases](https://github.com/oschwartz10612/poppler-windows/releases).
2. Extract it, e.g. to `C:\poppler`.
3. Add `C:\poppler\Library\bin` to PATH the same way as FFmpeg above.
4. New terminal, verify: `pdftoppm -v`.

---

## 5. Setup

### 5.1 Backend

```bash
cd backend
copy .env.example .env
```

Edit `backend\.env`:
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET_NAME` — from your Supabase project (create the project, then Storage → New Bucket, then Project Settings → API for the URL/key).
- `GROQ_API_KEYS` (or `GROQ_API_KEY` for just one) — see §6.
- Leave `RABBITMQ_URL=redis://localhost:6379/0` and `REDIS_URL=redis://localhost:6379/1` as-is — that's your local Redis from §4.3, both roles on one instance, different DB numbers.

Install dependencies and run (two separate terminals, both with the venv activated):

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# Terminal 1 — API server
uvicorn app.main:app --reload --port 8000

# Terminal 2 — background worker (does the actual PDF/script/audio work)
# --pool=solo avoids known Celery multiprocessing issues on Windows
celery -A app.celery_app worker --loglevel=info --pool=solo
```

You now have 3 things running at once: Redis (§4.3, its own window), `uvicorn` (terminal 1), `celery` (terminal 2). Leave all three open.

(If you ever install Docker Desktop later, `docker-compose up --build` from the repo root does all of this — including Redis — in one command. Not needed now.)

### 5.2 Frontend

```bash
cd frontend
npm install
copy .env.example .env
```

Edit `frontend\.env`:
- `VITE_API_BASE_URL=http://localhost:8000`
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — same Supabase project, Project Settings → API (use the **anon/public** key here, not the service role key).

```bash
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`) in **Chrome or Edge** (required for video generation, see §2).

---

## 6. The Groq multi-key trick (getting more free generations)

Groq's free tier limits requests **per API key/account** (requests-per-minute and requests-per-day). Since script generation now calls Groq once per batch of ~4 panels (see `backend/app/utils/openai_utils.py`), a long chapter can use several calls — so a single free key can get rate-limited on heavy use.

Each Groq account has its own independent free quota, so:

1. Create a Groq account per Google/email account you have (console.groq.com → sign in → API Keys → Create Key).
2. Collect all the keys, comma-separate them in your `.env`:
   ```
   GROQ_API_KEYS=gsk_key_one,gsk_key_two,gsk_key_three,...
   ```
3. The backend (`backend/app/utils/groq_pool.py`) round-robins across all configured keys automatically, and if one comes back rate-limited mid-request, it retries with the next key before falling back to a generic caption. No code changes needed beyond setting the env var — more keys = more effective daily capacity, roughly linearly.

**Heads up:** this relies on creating multiple accounts on a third-party service, which is a gray area against most providers' one-account-per-person terms of service — Groq could in theory rate-limit or ban abusive patterns at their discretion. This is your call to make as the account holder; the code just makes using N keys convenient, it doesn't create the accounts for you.

---

## 7. Logging in (needed before video generation)

Video generation is gated behind Supabase auth. Simplest path, no separate account needed beyond your own email:

1. Go to `/login` in the app, enter any email address you can read (yours).
2. Click **Continue with Email** — Supabase emails you a 6-digit code (check spam folder too).
3. Enter the code — you're logged in. That's it; Supabase's free tier includes a small number of these auth emails per hour, plenty for personal use.

(Google sign-in is also wired up but needs OAuth configured in your Supabase project's Auth settings — email code is simpler for solo local use.)

## 8. Generating your first script and video

1. Make sure all 3 backend processes are running (Redis, `uvicorn`, `celery` — §5.1) and the frontend is running (§5.2).
2. Open the frontend in Chrome/Edge, go to Upload.
3. Drop a manga/manhwa/manhua chapter PDF (< 50MB).
4. In Settings, pick **Narration Language** (Hinglish / Hindi / English) and **Video Orientation** (vertical Shorts / horizontal 16:9).
5. Click **Generate Story**. This is the "script" step: the backend extracts panels from the PDF, sends them to Groq in batches to write the narration, converts the narration to speech, and uploads everything to Supabase. Watch the `celery` terminal — it prints progress (`🖼️ Extracting Images...`, `📝 Generating Script...`, `🎤 Generating Audio...`, etc.). Takes roughly 1-3 minutes depending on chapter length.
6. Once it finishes, extracted panels appear in the UI. Log in if you haven't (§7).
7. Click **Generate Video** — this step runs entirely in your browser (see §2), rendering the actual MP4 client-side. Watch the on-page progress log.
8. Preview the result, click **Download** to save the `.mp4` to your PC.
9. Upload it to YouTube yourself — this tool doesn't auto-publish (YouTube's upload API needs per-channel OAuth, deliberately left as a manual step).

---

## 9. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `No GROQ_API_KEY(S) configured` | `.env` missing `GROQ_API_KEYS`/`GROQ_API_KEY`, or worker didn't pick up the `.env` (restart the `celery` terminal after editing `.env`) |
| Narration stuck on generic "Scene N of X chalta hai..." lines | All configured Groq keys hit rate limits, or Groq returned malformed JSON — check the `celery` terminal for the actual error |
| `Generate Video` button does nothing / silent failure | Browser isn't Chromium-based (Firefox/Safari lack `VideoEncoder` support) |
| `SUPABASE_URL not set` | Missing/incomplete `backend\.env` |
| `EnvironmentError: FFmpeg not found` | FFmpeg not on PATH — open a **new** terminal after editing PATH (old ones don't pick it up), verify with `ffmpeg -version` |
| `pdf2image.exceptions.PDFInfoNotInstalledError` | Poppler not on PATH — verify with `pdftoppm -v`, open a new terminal after editing PATH |
| Backend `/` responds but jobs never finish | `celery` terminal isn't running, or Redis isn't running (`redis-cli ping` should say `PONG`) |
| Celery worker crashes immediately on Windows | Missing `--pool=solo` flag — Celery's default pool has known issues on Windows |
| CORS errors in browser console | `VITE_API_BASE_URL` in `frontend\.env` doesn't match where `uvicorn` is actually running |

---

## 10. Going live later (optional — not needed for localhost)

If you ever want this reachable from outside your machine (e.g. share it, or run it on a schedule from somewhere other than your PC), swap the local pieces for hosted equivalents. Nothing in the code changes — just env vars and where things run.

| Local piece | Hosted equivalent | Free tier |
|---|---|---|
| Local Redis container | [CloudAMQP](https://www.cloudamqp.com) (RabbitMQ, "Little Lemur" plan) for the broker + [Upstash](https://upstash.com) (Redis) for the result backend | Yes |
| `uvicorn`/`celery` running on your PC | [Hugging Face Spaces](https://huggingface.co/spaces), Docker SDK | Yes |
| `npm run dev` on your PC | [Vercel](https://vercel.com) | Yes |

**Backend → Hugging Face Spaces:** `backend/Dockerfile` is already built for this (single container runs both the API and the Celery worker, listens on port 7860, which is what HF Spaces expects).

1. Create a new Space on huggingface.co, SDK = Docker.
2. Push this repo's `backend/` folder as the Space's contents (or point the Space at your GitHub repo).
3. In Space Settings → Repository secrets, add: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET_NAME`, `GROQ_API_KEYS`, and your real `RABBITMQ_URL`/`REDIS_URL` from CloudAMQP/Upstash (not the local `redis://localhost` ones).
4. Space builds and starts automatically. Your API is at `https://<your-space>.hf.space`.

(The README also documents a Google Cloud Run deployment path if you'd rather use that instead — same env vars, different platform.)

**Frontend → Vercel:** import the repo, set root directory to `frontend`, set `VITE_API_BASE_URL` to your deployed backend's URL plus the Supabase values, deploy.
