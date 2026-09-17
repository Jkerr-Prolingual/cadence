-- 024: Add WPM and words_read to pronunciation_assessments
-- Recording assessment now computes WPM from Whisper timestamps,
-- replacing the separate fluency_sessions table for new recordings.

alter table pronunciation_assessments
  add column if not exists wpm integer,
  add column if not exists words_read integer;
