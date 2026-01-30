-- Add live session columns to quizzes table
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS is_live_session BOOLEAN DEFAULT false;

ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS live_status TEXT DEFAULT 'idle' CHECK (live_status IN ('idle', 'waiting', 'active'));

-- Enable Realtime for quizzes table if not already enabled
-- Check if the table is already in the publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'quizzes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE quizzes;
    END IF;
END $$;

-- Policy to allow teachers to update their own quizzes (including live status)
-- RLS check
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quizzes' 
        AND policyname = 'Teachers can update their own quizzes'
    ) THEN
        CREATE POLICY "Teachers can update their own quizzes" ON quizzes
        FOR UPDATE
        USING (auth.uid() = created_by);
    END IF;
END $$;
