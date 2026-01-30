-- LIVE RACE SCHEMA UPDATE
-- Run this in the Supabase SQL Editor

-- 1. Add columns to track live progress
alter table public.quiz_results add column if not exists current_question int default 0;
alter table public.quiz_results add column if not exists status text default 'in-progress';

-- 2. Ensure Realtime is enabled for quiz_results
-- This needs to be run as a superuser or via the Supabase Dashboard
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_results;

-- Note: In Supabase, you can also enable this via the Dashboard:
-- Database -> Publications -> supabase_realtime -> Tables
