-- Copy and paste this into the Supabase SQL Editor to set up your database

-- 1. Create Quizzes Table
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  grade_level int,
  subject text,
  time_limit int default 60,
  access_code text unique not null,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Create Results Table
create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  quiz_id uuid references public.quizzes(id),
  score int,
  total_questions int,
  time_taken int,
  answers jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Enable Public Access (Simplifies connection for students)
alter table public.quizzes enable row level security;
alter table public.quiz_results enable row level security;

create policy "Allow public select quizzes" on public.quizzes for select using (true);
create policy "Allow public insert quizzes" on public.quizzes for insert with check (true);
create policy "Allow public update quizzes" on public.quizzes for update using (true);
create policy "Allow public delete quizzes" on public.quizzes for delete using (true);

create policy "Allow public insert results" on public.quiz_results for insert with check (true);
create policy "Allow public select results" on public.quiz_results for select using (true);

-- 4. Enable Realtime capabilities
alter publication supabase_realtime add table public.quizzes;
alter publication supabase_realtime add table public.quiz_results;
