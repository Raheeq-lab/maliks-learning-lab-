
-- ... (Previous content preserved implicitly, but appending or overwriting with full content)
-- Ideally I should overwrite with the FULL content to be safe, but since the user just wants the missing part,
-- I will just provide the missing part in the Artifact, but for the file I should probably write the whole thing?
-- The previous write_to_file replaced the whole file. I should write the WHOLE file again including the RPCs.

-- 1. FIX PRIMARY KEY TYPES (Text -> UUID)
do $$
begin
  if exists(select 1 from information_schema.columns where table_name='lessons' and column_name='id' and data_type='text') then
      alter table public.lessons alter column id type uuid using id::uuid;
      alter table public.lessons alter column id set default gen_random_uuid();
  end if;
exception when others then
  raise notice 'Could not convert lessons.id to UUID. Check your data.';
end $$;

-- 2. FIX COLUMN NAMES
do $$
begin
  if exists(select 1 from information_schema.columns where table_name='lessons' and column_name='createdby') then
    alter table public.lessons rename column createdby to created_by;
  end if;
  if exists(select 1 from information_schema.columns where table_name='quizzes' and column_name='createdby') then
    alter table public.quizzes rename column createdby to created_by;
  end if;
end $$;

-- 3. ENSURE COLUMNS EXIST
alter table public.quizzes add column if not exists created_by uuid references auth.users(id);
alter table public.quizzes add column if not exists is_public boolean default false;
alter table public.quizzes add column if not exists copied_from uuid references public.quizzes(id);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  grade_level int,
  subject text,
  content jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  access_code text unique not null,
  is_public boolean default false,
  copied_from uuid references public.lessons(id),
  learning_type text,
  lesson_structure jsonb default '{}'::jsonb,
  activity jsonb
);

alter table public.lessons add column if not exists created_by uuid references auth.users(id);
alter table public.lessons add column if not exists is_public boolean default false;
alter table public.lessons add column if not exists copied_from uuid;


-- 4. FIX TYPES & CONSTRAINTS
do $$
begin
  alter table public.quizzes alter column created_by type uuid using created_by::uuid;
  alter table public.lessons alter column created_by type uuid using created_by::uuid;
  
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'lessons_copied_from_fkey') then
    alter table public.lessons add constraint lessons_copied_from_fkey foreign key (copied_from) references public.lessons(id);
  end if;
end $$;


-- 5. RE-CREATE POLICIES
drop policy if exists "Teachers view own or public quizzes" on public.quizzes;
drop policy if exists "Teachers create quizzes" on public.quizzes;
drop policy if exists "Teachers update own quizzes" on public.quizzes;
drop policy if exists "Teachers delete own quizzes" on public.quizzes;

drop policy if exists "Teachers view own or public lessons" on public.lessons;
drop policy if exists "Teachers create lessons" on public.lessons;
drop policy if exists "Teachers update own lessons" on public.lessons;
drop policy if exists "Teachers delete own lessons" on public.lessons;

alter table public.quizzes enable row level security;
alter table public.lessons enable row level security;

create policy "Teachers view own or public quizzes" on public.quizzes for select using ( (auth.uid() = created_by) OR (is_public = true) );
create policy "Teachers create quizzes" on public.quizzes for insert with check ( auth.uid() = created_by );
create policy "Teachers update own quizzes" on public.quizzes for update using ( auth.uid() = created_by );
create policy "Teachers delete own quizzes" on public.quizzes for delete using ( auth.uid() = created_by );

create policy "Teachers view own or public lessons" on public.lessons for select using ( (auth.uid() = created_by) OR (is_public = true) );
create policy "Teachers create lessons" on public.lessons for insert with check ( auth.uid() = created_by );
create policy "Teachers update own lessons" on public.lessons for update using ( auth.uid() = created_by );
create policy "Teachers delete own lessons" on public.lessons for delete using ( auth.uid() = created_by );

-- 6. RPC FUNCTIONS (Crucial for students!)
create or replace function get_quiz_by_access_code(code_input text)
returns setof public.quizzes
language sql
security definer
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
