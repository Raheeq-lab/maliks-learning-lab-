
-- SQL Schema for Malik's Learning Lab

-- 1. Quizzes Table
CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  gradeLevel INTEGER NOT NULL,
  subject TEXT NOT NULL,
  timeLimit INTEGER NOT NULL,
  accessCode TEXT NOT NULL UNIQUE,
  createdBy TEXT NOT NULL,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  questions JSONB NOT NULL
);

-- 2. Lessons Table
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  gradeLevel INTEGER NOT NULL,
  subject TEXT NOT NULL,
  content JSONB NOT NULL,
  createdBy TEXT NOT NULL,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  accessCode TEXT NOT NULL UNIQUE,
  learningType TEXT,
  lessonStructure JSONB,
  activity JSONB
);

-- 3. Results Table
CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  studentName TEXT NOT NULL,
  quizId TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  totalQuestions INTEGER NOT NULL,
  timeTaken INTEGER NOT NULL,
  completedAt TIMESTAMPTZ DEFAULT NOW(),
  answers JSONB NOT NULL
);

-- 4. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  school TEXT,
  grades INTEGER[],
  subjects TEXT[],
  passwordHash TEXT -- In a real app, use Supabase Auth instead
);

-- Enable Row Level Security (RLS)
-- For a simple lab, we can enable public access or set up basic policies
-- Here we allow all operations for simplicity in this demo environment
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access" ON quizzes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON lessons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON teachers FOR ALL USING (true) WITH CHECK (true);
