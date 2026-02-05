
-- Create a table to track daily AI usage globally
CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
    cloudflare_count INTEGER DEFAULT 0,
    gemini_count INTEGER DEFAULT 0,
    cached_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime for this table so dashboards update instantly
ALTER PUBLICATION supabase_realtime ADD TABLE ai_usage_stats;

-- Create a function to atomically increment counters
-- calling signature: increment_ai_usage('cloudflare' | 'gemini' | 'cached')
CREATE OR REPLACE FUNCTION increment_ai_usage(provider TEXT)
RETURNS VOID AS $$
DECLARE
    today DATE := CURRENT_DATE;
BEGIN
    -- Ensure a row exists for today
    INSERT INTO ai_usage_stats (date, cloudflare_count, gemini_count, cached_count)
    VALUES (today, 0, 0, 0)
    ON CONFLICT (date) DO NOTHING;

    -- Update based on provider
    IF provider = 'cloudflare' THEN
        UPDATE ai_usage_stats SET cloudflare_count = cloudflare_count + 1, last_updated = NOW() WHERE date = today;
    ELSIF provider = 'gemini' THEN
        UPDATE ai_usage_stats SET gemini_count = gemini_count + 1, last_updated = NOW() WHERE date = today;
    ELSIF provider = 'cached' THEN
        UPDATE ai_usage_stats SET cached_count = cached_count + 1, last_updated = NOW() WHERE date = today;
    END IF;
END;
$$ LANGUAGE plpgsql;
