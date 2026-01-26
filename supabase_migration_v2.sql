
-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. MODIFY QUIZZES TABLE
alter table public.quizzes 
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists is_public boolean default false,
  add column if not exists copied_from uuid references public.quizzes(id);

-- 2. CREATE LESSONS TABLE
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  grade_level int,
  subject text,
  content jsonb not null default '[]'::jsonb, -- Stores the lesson content blocks
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  access_code text unique not null,
  is_public boolean default false,
  copied_from uuid references public.lessons(id),
  learning_type text, -- Added to match TypeScript interface
  lesson_structure jsonb default '{}'::jsonb, -- For scaffolded lessons
  activity jsonb -- For lesson-level activity settings
);

-- 3. ENABLE RLS
alter table public.quizzes enable row level security;
alter table public.lessons enable row level security;

-- Drop existing policies to avoid conflicts if re-running
drop policy if exists "Allow public select quizzes" on public.quizzes;
drop policy if exists "Allow public insert quizzes" on public.quizzes;
drop policy if exists "Allow public update quizzes" on public.quizzes;
drop policy if exists "Allow public delete quizzes" on public.quizzes;

-- 4. POLICIES FOR QUIZZES

-- READ: Teachers see their own OR public quizzes. 
-- Note for Students: We will typically use an RPC "security definer" function for students 
-- so they can access via code without being "authenticated" as a user.
-- But for the dashboard "Library", this is the policy:
create policy "Teachers view own or public quizzes" 
on public.quizzes for select 
using (
  (auth.uid() = created_by) OR (is_public = true)
);

-- INSERT: Authenticated users can create quizzes
create policy "Teachers create quizzes" 
on public.quizzes for insert 
with check (
  auth.uid() = created_by
);

-- UPDATE: Only creator can update
create policy "Teachers update own quizzes" 
on public.quizzes for update 
using (
  auth.uid() = created_by
);

-- DELETE: Only creator can delete
create policy "Teachers delete own quizzes" 
on public.quizzes for delete 
using (
  auth.uid() = created_by
);


-- 5. POLICIES FOR LESSONS (Same logic)

create policy "Teachers view own or public lessons" 
on public.lessons for select 
using (
  (auth.uid() = created_by) OR (is_public = true)
);

create policy "Teachers create lessons" 
on public.lessons for insert 
with check (
  auth.uid() = created_by
);

create policy "Teachers update own lessons" 
on public.lessons for update 
using (
  auth.uid() = created_by
);

create policy "Teachers delete own lessons" 
on public.lessons for delete 
using (
  auth.uid() = created_by
);

-- 6. RPC Functions for Student Access (Bypassing RLS for specific access codes)

create or replace function get_quiz_by_access_code(code_input text)
returns setof public.quizzes
language sql
security definer -- Runs with privileges of the creator (postgres/admin)
as $$
  select * from public.quizzes
  where access_code = upper(code_input)
  limit 1;
$$;

create or replace function get_lesson_by_access_code(code_input text)
returns setof public.lessons
language sql
security definer
as $$
  select * from public.lessons
  where access_code = upper(code_input)
  limit 1;
$$;
