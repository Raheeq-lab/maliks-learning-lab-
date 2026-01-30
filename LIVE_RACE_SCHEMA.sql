-- LIVE_RACE_SCHEMA.sql (Definitive Version)
-- Run this in the Supabase SQL Editor

-- 1. ADD COLUMNS
-- These are the critical columns for the Live Race feature
alter table public.quiz_results add column if not exists current_question int default 0;
alter table public.quiz_results add column if not exists status text default 'in-progress';

-- 2. UPDATE SECURITY POLICY
-- We drop it first to avoid "already exists" errors
drop policy if exists "Allow public update results" on public.quiz_results;
create policy "Allow public update results" on public.quiz_results for update using (true);

-- 3. ENABLE REALTIME
-- Wrap in a DO block to ignore if already member of publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'quiz_results'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_results;
    END IF;
END $$;
