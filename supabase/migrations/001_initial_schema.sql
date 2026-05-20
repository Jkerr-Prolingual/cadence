-- Cadence: initial schema
-- Tables: profiles, classes, class_enrollments, curated_texts,
--          user_progress, reading_sessions, recordings, transcriptions,
--          flag_events, student_recordings, fluency_sessions, srs_cards

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  l1 text default 'es',
  cefr_estimate text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users read own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users update own profile"
  on profiles for update using (auth.uid() = id);
create policy "Admins read all profiles"
  on profiles for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- CLASSES
-- ============================================================
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id),
  class_name text not null,
  class_code text unique not null,
  expires_at timestamptz,
  max_students integer default 40,
  created_at timestamptz default now()
);

alter table classes enable row level security;

create policy "Teachers manage own classes"
  on classes for all using (auth.uid() = teacher_id);

-- ============================================================
-- CLASS ENROLLMENTS
-- ============================================================
create table if not exists class_enrollments (
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  enrolled_at timestamptz default now(),
  primary key (class_id, student_id)
);

alter table class_enrollments enable row level security;

create policy "Students read own enrollments"
  on class_enrollments for select using (auth.uid() = student_id);
create policy "Teachers read class enrollments"
  on class_enrollments for select using (
    exists (select 1 from classes where classes.id = class_id and classes.teacher_id = auth.uid())
  );

-- ============================================================
-- CURATED TEXTS
-- ============================================================
create table if not exists curated_texts (
  id text primary key,
  title text not null,
  author text,
  body text not null,
  source_type text default 'text' check (source_type in ('text', 'youtube')),
  youtube_id text,
  series_id text,
  series_order integer,
  word_count integer,
  cefr_estimate text,
  provenance_type text default 'original',
  rights_notes text,
  status text default 'draft' check (status in ('draft', 'published', 'archived')),
  audio_urls jsonb,
  audio_timestamps jsonb,
  audio_voice_ids text[],
  audio_generated_at timestamptz,
  published_at timestamptz,
  published_by uuid references profiles(id),
  created_at timestamptz default now()
);

alter table curated_texts enable row level security;

create policy "Anyone reads published texts"
  on curated_texts for select using (status = 'published');
create policy "Admins manage all texts"
  on curated_texts for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- USER PROGRESS (sync target for client-side word knowledge)
-- ============================================================
create table if not exists user_progress (
  user_id uuid primary key references profiles(id) on delete cascade,
  user_words jsonb default '{}'::jsonb,
  word_encounters jsonb default '{}'::jsonb,
  last_active_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_progress enable row level security;

create policy "Users manage own progress"
  on user_progress for all using (auth.uid() = user_id);
create policy "Teachers read enrolled students progress"
  on user_progress for select using (
    exists (
      select 1 from class_enrollments ce
      join classes c on c.id = ce.class_id
      where ce.student_id = user_progress.user_id
        and c.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- READING SESSIONS
-- ============================================================
create table if not exists reading_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  text_id text not null references curated_texts(id),
  pass_number integer not null default 1,
  mode text not null default 'silent' check (mode in ('silent', 'oral', 'shadow')),
  started_at timestamptz default now(),
  completed_at timestamptz
);

alter table reading_sessions enable row level security;

create policy "Students manage own sessions"
  on reading_sessions for all using (auth.uid() = student_id);
create policy "Teachers read enrolled student sessions"
  on reading_sessions for select using (
    exists (
      select 1 from class_enrollments ce
      join classes c on c.id = ce.class_id
      where ce.student_id = reading_sessions.student_id
        and c.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- RECORDINGS (oral read-alouds)
-- ============================================================
create table if not exists recordings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references reading_sessions(id) on delete cascade,
  storage_path text not null,
  duration_seconds float,
  device_info text,
  status text default 'uploaded' check (status in ('uploaded', 'transcribed', 'analyzed', 'reviewed')),
  created_at timestamptz default now()
);

alter table recordings enable row level security;

create policy "Students manage own recordings"
  on recordings for all using (
    exists (
      select 1 from reading_sessions rs
      where rs.id = recordings.session_id and rs.student_id = auth.uid()
    )
  );
create policy "Teachers read enrolled student recordings"
  on recordings for select using (
    exists (
      select 1 from reading_sessions rs
      join class_enrollments ce on ce.student_id = rs.student_id
      join classes c on c.id = ce.class_id
      where rs.id = recordings.session_id
        and c.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- TRANSCRIPTIONS (STT + pronunciation assessment output)
-- ============================================================
create table if not exists transcriptions (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references recordings(id) on delete cascade,
  provider text not null check (provider in ('whisper', 'azure', 'deepgram')),
  word_timestamps jsonb,
  fluency_score float,
  prosody_score float,
  completeness_score float,
  processed_at timestamptz default now()
);

alter table transcriptions enable row level security;

create policy "Students read own transcriptions"
  on transcriptions for select using (
    exists (
      select 1 from recordings r
      join reading_sessions rs on rs.id = r.session_id
      where r.id = transcriptions.recording_id
        and rs.student_id = auth.uid()
    )
  );

-- ============================================================
-- FLAG EVENTS (unified: student, AI, teacher)
-- ============================================================
create table if not exists flag_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references reading_sessions(id),
  student_id uuid not null references profiles(id),
  text_id text not null references curated_texts(id),
  headword text not null,
  surface_form text,
  word_position integer,
  source text not null check (source in ('student', 'ai', 'teacher')),
  source_user_id uuid references profiles(id),
  flag_type text not null check (flag_type in (
    'tongue_twister', 'meaning_unknown', 'hesitation',
    'restart', 'mispronunciation', 'skip', 'recognized', 'meaning_confirmed'
  )),
  severity integer check (severity between 1 and 5),
  audio_timestamp_ms integer,
  ai_confidence float,
  notes text,
  created_at timestamptz default now()
);

alter table flag_events enable row level security;

create policy "Students manage own flags"
  on flag_events for all using (auth.uid() = student_id);
create policy "Teachers write flags for enrolled students"
  on flag_events for insert with check (
    source = 'teacher' and source_user_id = auth.uid() and
    exists (
      select 1 from class_enrollments ce
      join classes c on c.id = ce.class_id
      where ce.student_id = flag_events.student_id
        and c.teacher_id = auth.uid()
    )
  );
create policy "Teachers read flags for enrolled students"
  on flag_events for select using (
    auth.uid() = student_id or
    exists (
      select 1 from class_enrollments ce
      join classes c on c.id = ce.class_id
      where ce.student_id = flag_events.student_id
        and c.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- FLUENCY SESSIONS (timed reading + shadowing)
-- ============================================================
create table if not exists fluency_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  text_id text not null references curated_texts(id),
  session_type text not null check (session_type in ('read', 'shadow')),
  pass_number integer not null,
  word_count integer,
  elapsed_seconds float,
  wpm float,
  session_date timestamptz default now()
);

alter table fluency_sessions enable row level security;

create policy "Students manage own fluency sessions"
  on fluency_sessions for all using (auth.uid() = student_id);
create policy "Teachers read enrolled student fluency"
  on fluency_sessions for select using (
    exists (
      select 1 from class_enrollments ce
      join classes c on c.id = ce.class_id
      where ce.student_id = fluency_sessions.student_id
        and c.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- SRS CARDS (Leitner box, synced)
-- ============================================================
create table if not exists srs_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  word text not null,
  leitner_box integer not null default 1 check (leitner_box between 1 and 5),
  next_review_date timestamptz not null default now(),
  last_review_date timestamptz,
  consecutive_correct integer default 0,
  card_type text default 'dual' check (card_type in ('dual', 'definition', 'cloze')),
  added_from_text text,
  added_date timestamptz default now(),
  unique(user_id, word)
);

alter table srs_cards enable row level security;

create policy "Users manage own SRS cards"
  on srs_cards for all using (auth.uid() = user_id);

-- ============================================================
-- STUDENT RECORDINGS (shadow read recordings for teacher review)
-- ============================================================
create table if not exists student_recordings (
  user_id uuid not null references profiles(id) on delete cascade,
  text_id text not null references curated_texts(id),
  storage_path text not null,
  duration_seconds float,
  playback_rate float default 1.0,
  recorded_at timestamptz default now(),
  primary key (user_id, text_id)
);

alter table student_recordings enable row level security;

create policy "Students manage own recordings"
  on student_recordings for all using (auth.uid() = user_id);
create policy "Teachers read enrolled student recordings"
  on student_recordings for select using (
    exists (
      select 1 from class_enrollments ce
      join classes c on c.id = ce.class_id
      where ce.student_id = student_recordings.user_id
        and c.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- JOIN CLASS RPC
-- ============================================================
create or replace function join_class_by_code(code text)
returns jsonb
language plpgsql security definer as $$
declare
  v_class_id uuid;
  v_class_name text;
  v_current_count integer;
  v_max integer;
  v_expires timestamptz;
begin
  select id, class_name, max_students, expires_at
    into v_class_id, v_class_name, v_max, v_expires
    from classes where class_code = code;

  if v_class_id is null then
    raise exception 'Invalid class code';
  end if;

  if v_expires is not null and v_expires < now() then
    raise exception 'Class code has expired';
  end if;

  select count(*) into v_current_count
    from class_enrollments where class_id = v_class_id;

  if v_max is not null and v_current_count >= v_max then
    raise exception 'Class is full';
  end if;

  insert into class_enrollments (class_id, student_id)
    values (v_class_id, auth.uid())
    on conflict do nothing;

  return jsonb_build_object('class_id', v_class_id, 'class_name', v_class_name);
end;
$$;
