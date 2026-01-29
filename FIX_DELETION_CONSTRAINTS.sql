-- Fix foreign key constraints to allow deletion
-- Run this in your Supabase SQL Editor

-- 1. Fix quiz_results -> quizzes (ON DELETE CASCADE)
-- This allows a quiz to be deleted even if students have taken it. The results will also be deleted.
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Find and drop ANY foreign key on quiz_results that points to quizzes(id)
    FOR r IN (
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'quiz_results'
          AND kcu.column_name = 'quiz_id'
          AND ccu.table_name = 'quizzes'
    ) LOOP
        EXECUTE 'ALTER TABLE public.quiz_results DROP CONSTRAINT ' || r.constraint_name;
    END LOOP;

    -- Add the correct constraint
    ALTER TABLE public.quiz_results 
    ADD CONSTRAINT quiz_results_quiz_id_fkey 
    FOREIGN KEY (quiz_id) 
    REFERENCES public.quizzes(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Fixed quiz_results constraint';
END $$;


-- 2. Fix lessons.copied_from (ON DELETE SET NULL)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Check if column exists first
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'copied_from') THEN
        
        -- Find and drop constraint
        FOR r IN (
            SELECT tc.constraint_name
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND tc.table_name = 'lessons'
              AND kcu.column_name = 'copied_from'
        ) LOOP
            EXECUTE 'ALTER TABLE public.lessons DROP CONSTRAINT ' || r.constraint_name;
        END LOOP;

        -- Add correct constraint
        ALTER TABLE public.lessons 
        ADD CONSTRAINT lessons_copied_from_fkey 
        FOREIGN KEY (copied_from) 
        REFERENCES public.lessons(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Fixed lessons copied_from constraint';
    END IF;
END $$;


-- 3. Fix quizzes.copied_from (ON DELETE SET NULL)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Check if column exists first
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'copied_from') THEN
        
        -- Find and drop constraint
        FOR r IN (
            SELECT tc.constraint_name
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND tc.table_name = 'quizzes'
              AND kcu.column_name = 'copied_from'
        ) LOOP
            EXECUTE 'ALTER TABLE public.quizzes DROP CONSTRAINT ' || r.constraint_name;
        END LOOP;

        -- Add correct constraint
        ALTER TABLE public.quizzes 
        ADD CONSTRAINT quizzes_copied_from_fkey 
        FOREIGN KEY (copied_from) 
        REFERENCES public.quizzes(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Fixed quizzes copied_from constraint';
    END IF;
END $$;
