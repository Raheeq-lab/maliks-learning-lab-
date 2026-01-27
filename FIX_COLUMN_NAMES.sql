-- Run this script to fix the "null value in column gradelevel" error

-- 1. Remove strict NOT NULL constraints from potential legacy column names
-- This allows the insert to succeed even if we only populate "grade_level"
DO $$
BEGIN
    -- For 'lessons' table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'gradelevel') THEN
        ALTER TABLE public.lessons ALTER COLUMN gradelevel DROP NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'gradeLevel') THEN
        ALTER TABLE public.lessons ALTER COLUMN "gradeLevel" DROP NOT NULL;
    END IF;

    -- For 'quizzes' table (preventative)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'gradelevel') THEN
        ALTER TABLE public.quizzes ALTER COLUMN gradelevel DROP NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'gradeLevel') THEN
        ALTER TABLE public.quizzes ALTER COLUMN "gradeLevel" DROP NOT NULL;
    END IF;
END $$;

-- 2. Ensure the correct column 'grade_level' exists and is used
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS grade_level int;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS grade_level int;

-- 3. Ensure other columns are present (re-run of previous fix just in case)
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS content jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS learning_type text;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS lesson_structure jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS activity jsonb;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS access_code text;
