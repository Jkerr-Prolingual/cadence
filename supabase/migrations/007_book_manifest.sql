-- Add vocabulary_manifest JSONB column to books
-- Stores per-book override translations, particles, and pedagogical notes
-- ingested from graded reader vocabulary_manifest.json files.
alter table books add column if not exists vocabulary_manifest jsonb;
