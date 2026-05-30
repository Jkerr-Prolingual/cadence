-- Fluency sessions: timed reading records for WPM tracking
create table if not exists fluency_sessions (
  id           text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  text_id      text not null,
  pass_number  integer not null default 1,
  word_count   integer not null,
  elapsed_seconds integer not null,
  wpm          integer not null,
  session_date timestamptz not null default now(),

  constraint fluency_sessions_positive_elapsed check (elapsed_seconds > 0),
  constraint fluency_sessions_positive_words  check (word_count > 0)
);

create index fluency_sessions_user_text on fluency_sessions(user_id, text_id);

-- RLS: students manage their own rows, teachers read enrolled students
alter table fluency_sessions enable row level security;

create policy "Students manage own fluency sessions"
  on fluency_sessions for all
  using (auth.uid() = user_id);

create policy "Teachers read enrolled students fluency sessions"
  on fluency_sessions for select
  using (
    exists (
      select 1 from class_enrollments ce
      join classes c on c.id = ce.class_id
      where ce.student_id = fluency_sessions.user_id
        and c.teacher_id = auth.uid()
    )
  );
