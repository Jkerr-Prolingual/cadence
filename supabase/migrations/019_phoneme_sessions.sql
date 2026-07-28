-- 019: Phoneme sessions — append-only fluency assessment phoneme statistics
-- Stores per-session phoneme median scores for longitudinal tracking

create table if not exists phoneme_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  text_id           text not null,
  session_date      timestamptz not null default now(),
  duration_seconds  integer not null,
  words_assessed    integer,
  overall_accuracy  float,
  fluency_score     float,
  prosody_score     float,
  phoneme_medians   jsonb not null,
  phoneme_counts    jsonb not null,
  weak_phonemes     jsonb not null,
  constraint phoneme_medians_not_empty check (phoneme_medians != '{}'::jsonb)
);

create index idx_phoneme_sessions_user_text
  on phoneme_sessions (user_id, text_id);

alter table phoneme_sessions enable row level security;

create policy "Students manage own phoneme sessions"
  on phoneme_sessions for all using (auth.uid() = user_id);

create policy "Teachers read enrolled student phoneme sessions"
  on phoneme_sessions for select using (
    public.is_teacher_of_student(user_id)
  );
