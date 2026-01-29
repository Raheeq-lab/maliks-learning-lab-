-- FIX VISIBILITY RLS
-- This script ensures strict visibility rules:
-- 1. Private content is ONLY visible to the creator.
-- 2. Public content is visible to everyone.
-- 3. Creators can always see/edit/delete their own content.

-- Enable RLS (Idempotent)
alter table public.quizzes enable row level security;
alter table public.lessons enable row level security;

-- DROP EXISTING POLICIES (To avoid conflicts/duplicates)
drop policy if exists "Teachers view own or public quizzes" on public.quizzes;
drop policy if exists "Teachers create quizzes" on public.quizzes;
drop policy if exists "Teachers update own quizzes" on public.quizzes;
drop policy if exists "Teachers delete own quizzes" on public.quizzes;
-- Also drop any potentially named generic policies
drop policy if exists "Enable read access for all users" on public.quizzes;
drop policy if exists "Enable insert for authenticated users only" on public.quizzes;

drop policy if exists "Teachers view own or public lessons" on public.lessons;
drop policy if exists "Teachers create lessons" on public.lessons;
drop policy if exists "Teachers update own lessons" on public.lessons;
drop policy if exists "Teachers delete own lessons" on public.lessons;


-- === QUIZZES POLICIES ===

-- SELECT: Users can see their own quizzes OR any public quizzes
create policy "Teachers view own or public quizzes" 
on public.quizzes for select 
using ( (auth.uid() = created_by) OR (is_public = true) );

-- INSERT: Users can create quizzes (created_by must match their UID)
create policy "Teachers create quizzes" 
on public.quizzes for insert 
with check ( auth.uid() = created_by );

-- UPDATE: Users can only update their own quizzes
create policy "Teachers update own quizzes" 
on public.quizzes for update 
using ( auth.uid() = created_by );

-- DELETE: Users can only delete their own quizzes
create policy "Teachers delete own quizzes" 
on public.quizzes for delete 
using ( auth.uid() = created_by );


-- === LESSONS POLICIES ===

-- SELECT: Users can see their own lessons OR any public lessons
create policy "Teachers view own or public lessons" 
on public.lessons for select 
using ( (auth.uid() = created_by) OR (is_public = true) );

-- INSERT: Users can create lessons
create policy "Teachers create lessons" 
on public.lessons for insert 
with check ( auth.uid() = created_by );

-- UPDATE: Users can only update their own lessons
create policy "Teachers update own lessons" 
on public.lessons for update 
using ( auth.uid() = created_by );

-- DELETE: Users can only delete their own lessons
create policy "Teachers delete own lessons" 
on public.lessons for delete 
using ( auth.uid() = created_by );
