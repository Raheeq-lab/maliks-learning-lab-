-- LIVE RACE SCHEMA UPDATE (REVISED)
-- Run this in the Supabase SQL Editor

-- 1. Add columns to track live progress (if not already added)
alter table public.quiz_results add column if not exists current_question int default 0;
alter table public.quiz_results add column if not exists status text default 'in-progress';

-- 2. Add missing RLS policy for updates
-- This allows students to update their own progress results
create policy "Allow public update results" on public.quiz_results for update using (true);

-- 3. Ensure Realtime is enabled for quiz_results
-- Run these one at a time if you get errors
alter publication supabase_realtime add table public.quiz_results;

-- Note: In Supabase, you can also enable this via the Dashboard:
-- Database -> Publications -> supabase_realtime -> Tables
-- Make sure "quiz_results" is checked.
