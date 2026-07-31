-- Add exercises JSONB column to books table
-- Stores per-chapter probe questions, same pattern as syntax_glosses
alter table books add column if not exists exercises jsonb;
