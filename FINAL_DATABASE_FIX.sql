-- MASTER FIX: RUN ALL OF THIS IN SUPABASE SQL EDITOR

-- 1. Fix Lessons Table (Missing time_limit column)
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS time_limit INTEGER DEFAULT 45;

-- 2. Fix AI Usage Stats Table & Security
CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
    cloudflare_count INTEGER DEFAULT 0,
    gemini_count INTEGER DEFAULT 0,
    cached_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and add public access (Fixes 406 error)
ALTER TABLE ai_usage_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read" ON ai_usage_stats;
CREATE POLICY "Allow public read" ON ai_usage_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public update" ON ai_usage_stats;
CREATE POLICY "Allow public update" ON ai_usage_stats FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public insert" ON ai_usage_stats;
CREATE POLICY "Allow public insert" ON ai_usage_stats FOR INSERT WITH CHECK (true);

-- 3. Fix Increment Function (Fixes 403 error)
CREATE OR REPLACE FUNCTION increment_ai_usage(provider TEXT)
RETURNS VOID AS $$
DECLARE
    today DATE := CURRENT_DATE;
BEGIN
    INSERT INTO ai_usage_stats (date)
    VALUES (today)
    ON CONFLICT (date) DO NOTHING;

    IF provider = 'cloudflare' THEN
        UPDATE ai_usage_stats SET cloudflare_count = cloudflare_count + 1, last_updated = NOW() WHERE date = today;
    ELSIF provider = 'gemini' THEN
        UPDATE ai_usage_stats SET gemini_count = gemini_count + 1, last_updated = NOW() WHERE date = today;
    ELSIF provider = 'cached' THEN
        UPDATE ai_usage_stats SET cached_count = cached_count + 1, last_updated = NOW() WHERE date = today;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER bypasses RLS for the update

-- Grant permissions to dashboard users
GRANT EXECUTE ON FUNCTION increment_ai_usage(TEXT) TO authenticated, anon;
GRANT ALL ON TABLE ai_usage_stats TO authenticated, anon;
