
-- 1. FIX COLUMN NAMES (accesscode -> access_code)
-- To match the frontend code, we must ensure the column is named "access_code"
do $$
begin
  -- For Lessons
  if exists(select 1 from information_schema.columns where table_name='lessons' and column_name='accesscode') then
    alter table public.lessons rename column accesscode to access_code;
  end if;
  
  -- For Quizzes (Check this too just in case)
  if exists(select 1 from information_schema.columns where table_name='quizzes' and column_name='accesscode') then
    alter table public.quizzes rename column accesscode to access_code;
  end if;
end $$;


-- 2. CREATE RPC FUNCTIONS (Now that column name is guaranteed)

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
