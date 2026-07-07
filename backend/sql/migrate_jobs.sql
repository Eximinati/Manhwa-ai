ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS reading_direction TEXT DEFAULT 'right-to-left';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS manga_genre TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS manga_language TEXT DEFAULT 'hinglish';
