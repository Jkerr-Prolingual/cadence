-- 016: Pronunciation assessment pipeline
-- Adds assessment tracking to student_recordings + new pronunciation_assessments table

-- ============================================================
-- STUDENT_RECORDINGS: add assessment status columns
-- ============================================================
alter table student_recordings
  add column if not exists assessment_status text,
  add column if not exists assessment_error text;

-- ============================================================
-- PRONUNCIATION_ASSESSMENTS: store pipeline results
-- ============================================================
create table if not exists pronunciation_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  text_id text not null,
  whisper_transcript text,
  whisper_word_timestamps jsonb,
  alignment jsonb,
  azure_word_scores jsonb,
  azure_fluency_score float,
  azure_prosody_score float,
  azure_completeness_score float,
  overall_accuracy float,
  processed_at timestamptz default now(),
  unique (user_id, text_id)
);

alter table pronunciation_assessments enable row level security;

create policy "Students manage own pronunciation assessments"
  on pronunciation_assessments for all using (auth.uid() = user_id);

create policy "Teachers read enrolled student pronunciation assessments"
  on pronunciation_assessments for select using (
    public.is_teacher_of_student(user_id)
  );
