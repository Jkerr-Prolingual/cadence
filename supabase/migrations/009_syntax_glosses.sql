-- Add syntax_glosses JSONB column to books
-- Stores per-book full-text phrase-level segmentation with Spanish translations,
-- grammatical type, complexity flags, and constituent translations.
-- Ingested from graded reader syntax_glosses.json files.
alter table books add column if not exists syntax_glosses jsonb;
