-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- TO ENABLE THE FLASHCARDS FEATURE

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  grade_level int,
  subject text,
  cards jsonb not null default '[]'::jsonb,
  access_code text unique,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  is_public boolean default false
);

-- Enable RLS
alter table public.flashcards enable row level security;

-- Policies
create policy "Users can view their own flashcards" on public.flashcards
  for select using (auth.uid() = created_by);

create policy "Users can insert their own flashcards" on public.flashcards
  for insert with check (auth.uid() = created_by);

create policy "Users can update their own flashcards" on public.flashcards
  for update using (auth.uid() = created_by);

create policy "Users can delete their own flashcards" on public.flashcards
  for delete using (auth.uid() = created_by);

create policy "Public can view public flashcards" on public.flashcards
  for select using (is_public = true);

-- Enable Realtime
alter publication supabase_realtime add table public.flashcards;
