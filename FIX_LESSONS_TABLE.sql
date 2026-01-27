-- Run this in your Supabase SQL Editor to fix the "missing column" error

-- Ensure 'lessons' table has all required columns
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS grade_level int;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS content jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS learning_type text;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS lesson_structure jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS activity jsonb;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS access_code text;

-- Ensure 'quizzes' table has all required columns (just in case)
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS grade_level int;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS time_limit int;

-- Fix access_code uniqueness if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lessons_access_code_key') THEN
        ALTER TABLE public.lessons ADD CONSTRAINT lessons_access_code_key UNIQUE (access_code);
    END IF;
END $$;
