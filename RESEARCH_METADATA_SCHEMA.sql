-- Migration: Add Pedagogical Research Metadata to Lessons Table
-- Description: Adds columns to persist AI-generated and manually entered research notes, visual themes, assessment settings, and required resources.

ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS research_notes JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS visual_theme JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS assessment_settings JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS required_resources JSONB DEFAULT NULL;

-- Example Structure for reference (Postgres JSONB):
-- research_notes: { "misconceptions": [], "strategies": [], "realWorldConnections": [], "vocabulary": [], "priorKnowledge": [] }
-- visual_theme: { "primaryTheme": "", "colorPalette": "", "characters": "", "animationStyle": "", "soundTheme": "" }
-- assessment_settings: { "formativeChecks": "", "extension": "", "support": "", "accessibility": "" }
-- required_resources: { "visualAssets": "", "interactiveTools": "", "props": "", "teacherNotes": "" }

COMMENT ON COLUMN lessons.research_notes IS 'Pedagogical research findings including student misconceptions and teaching strategies.';
COMMENT ON COLUMN lessons.visual_theme IS 'Detailed visual design concept for the lesson UI components.';
COMMENT ON COLUMN lessons.assessment_settings IS 'Formative assessment checkpoints and differentiation notes.';
COMMENT ON COLUMN lessons.required_resources IS 'Assets, interactive tools, and teacher-specific pedagogical notes.';
