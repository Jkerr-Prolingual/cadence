-- 021: Add phoneme confusion tracking to phoneme_sessions
-- Stores per-session confusion pairs (expected vs. produced phoneme) from Azure NBest data

alter table phoneme_sessions
  add column if not exists phoneme_confusions jsonb;
