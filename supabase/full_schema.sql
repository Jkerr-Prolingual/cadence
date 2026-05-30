-- ================================================================
-- Cadence: Full Supabase Schema
-- Paste this into the Supabase SQL Editor and run.
--
-- Structure: all tables first, then RLS + policies, then
-- functions/triggers/storage — avoids forward-reference errors.
-- ================================================================


-- ************************************************************
-- PART 1: CREATE ALL TABLES
-- ************************************************************

-- 1. PROFILES
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

-- 2. CLASSES
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id),
  class_name text not null,
  class_code text unique not null,
  expires_at timestamptz,
  max_students integer default 40,
  created_at timestamptz default now()
);

-- 3. CLASS ENROLLMENTS
create table if not exists class_enrollments (
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  enrolled_at timestamptz default now(),
  primary key (class_id, student_id)
);

-- 4. CURATED TEXTS
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
  analysis jsonb,
  audio_urls jsonb,
  audio_timestamps jsonb,
  audio_voice_ids text[],
  audio_generated_at timestamptz,
  cover_image_url text,
  published_at timestamptz,
  published_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- 5. ASSIGNMENTS
create table if not exists assignments (
  id text primary key,
  class_id uuid references classes(id) on delete cascade not null,
  text_id text not null,
  title text not null,
  tasks jsonb not null default '{}',
  due_date date,
  archived_at timestamptz,
  created_at timestamptz default now()
);

-- 6. ASSIGNMENT PROGRESS
create table if not exists assignment_progress (
  id text primary key,
  assignment_id text references assignments(id) on delete cascade not null,
  student_id uuid references profiles(id) not null,
  completed jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- 7. SRS CARDS
create table if not exists srs_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  word text not null,
  front text,
  back text,
  card_type text default 'spanish' check (card_type in ('spanish', 'cloze', 'dual', 'definition')),
  cefr text,
  spanish text,
  image_url text,
  image_attribution text,
  text_id text,
  text_title text,
  leitner_box integer not null default 1 check (leitner_box between 1 and 5),
  next_review_date timestamptz not null default now(),
  last_review_date timestamptz,
  consecutive_correct integer default 0,
  added_from_text text,
  added_date timestamptz default now(),
  unique(user_id, word)
);

-- 8. ENCOUNTERS
create table if not exists encounters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  headword text not null,
  word text,
  cefr text,
  text_id text,
  type text default 'lookup',
  created_at timestamptz default now()
);

-- 9. REVIEW LOG
create table if not exists review_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  word text not null,
  response integer,
  correct boolean,
  box_before integer,
  box_after integer,
  reviewed_at timestamptz default now()
);

-- 10. USER PROGRESS
create table if not exists user_progress (
  user_id uuid primary key references profiles(id) on delete cascade,
  user_words jsonb default '{}'::jsonb,
  word_encounters jsonb default '{}'::jsonb,
  last_active_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 11. READING SESSIONS
create table if not exists reading_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  text_id text not null,
  pass_number integer not null default 1,
  mode text not null default 'silent' check (mode in ('silent', 'oral', 'shadow')),
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- 12. RECORDINGS
create table if not exists recordings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references reading_sessions(id) on delete cascade,
  storage_path text not null,
  duration_seconds float,
  device_info text,
  status text default 'uploaded' check (status in ('uploaded', 'transcribed', 'analyzed', 'reviewed')),
  created_at timestamptz default now()
);

-- 13. TRANSCRIPTIONS
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

-- 14. FLAG EVENTS
create table if not exists flag_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references reading_sessions(id),
  student_id uuid not null references profiles(id),
  text_id text not null,
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

-- 15. FLUENCY SESSIONS
create table if not exists fluency_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  text_id text not null,
  session_type text not null check (session_type in ('read', 'shadow')),
  pass_number integer not null,
  word_count integer,
  elapsed_seconds float,
  wpm float,
  session_date timestamptz default now()
);

-- 16. STUDENT RECORDINGS
create table if not exists student_recordings (
  user_id uuid not null references profiles(id) on delete cascade,
  text_id text not null,
  storage_path text not null,
  duration_seconds float,
  playback_rate float default 1.0,
  recorded_at timestamptz default now(),
  primary key (user_id, text_id)
);


-- ************************************************************
-- PART 2: ENABLE RLS ON ALL TABLES
-- ************************************************************

alter table profiles enable row level security;
alter table classes enable row level security;
alter table class_enrollments enable row level security;
alter table curated_texts enable row level security;
alter table assignments enable row level security;
alter table assignment_progress enable row level security;
alter table srs_cards enable row level security;
alter table encounters enable row level security;
alter table review_log enable row level security;
alter table user_progress enable row level security;
alter table reading_sessions enable row level security;
alter table recordings enable row level security;
alter table transcriptions enable row level security;
alter table flag_events enable row level security;
alter table fluency_sessions enable row level security;
alter table student_recordings enable row level security;


-- ************************************************************
-- PART 3: HELPER FUNCTIONS (must exist before policies)
--
-- SECURITY DEFINER functions bypass RLS on the tables they read.
-- This breaks the classes ↔ class_enrollments circular reference
-- that otherwise causes "infinite recursion detected in policy".
-- ************************************************************

create or replace function public.is_class_teacher(p_class_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.classes
    where id = p_class_id and teacher_id = auth.uid()
  );
$$;

create or replace function public.is_class_member(p_class_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.class_enrollments
    where class_id = p_class_id and student_id = auth.uid()
  );
$$;

create or replace function public.is_teacher_of_student(p_student_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.class_enrollments ce
    join public.classes c on c.id = ce.class_id
    where ce.student_id = p_student_id
      and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;


-- ************************************************************
-- PART 4: ALL RLS POLICIES
-- ************************************************************

-- ── profiles ──────────────────────────────────────────────────
create policy "Users read own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users update own profile"
  on profiles for update using (auth.uid() = id);
create policy "Admins read all profiles"
  on profiles for select using (public.is_admin());
create policy "Teachers read enrolled student profiles"
  on profiles for select using (
    public.is_teacher_of_student(id)
  );

-- ── classes ───────────────────────────────────────────────────
create policy "Teachers manage own classes"
  on classes for all using (auth.uid() = teacher_id);
create policy "Students read enrolled classes"
  on classes for select using (
    public.is_class_member(id)
  );

-- ── class_enrollments ─────────────────────────────────────────
create policy "Students read own enrollments"
  on class_enrollments for select using (auth.uid() = student_id);
create policy "Students insert own enrollment"
  on class_enrollments for insert with check (auth.uid() = student_id);
create policy "Teachers read class enrollments"
  on class_enrollments for select using (
    public.is_class_teacher(class_id)
  );
create policy "Teachers manage enrollments for own classes"
  on class_enrollments for delete using (
    public.is_class_teacher(class_id)
  );

-- ── curated_texts ─────────────────────────────────────────────
create policy "Anyone reads published texts"
  on curated_texts for select using (status = 'published');
create policy "Admins manage all texts"
  on curated_texts for all using (public.is_admin());

-- ── assignments ───────────────────────────────────────────────
create policy "Teachers manage assignments for own classes"
  on assignments for all using (
    public.is_class_teacher(class_id)
  );
create policy "Students read assignments for enrolled classes"
  on assignments for select using (
    public.is_class_member(class_id)
  );

-- ── assignment_progress ───────────────────────────────────────
create policy "Students manage own assignment progress"
  on assignment_progress for all using (auth.uid() = student_id);
create policy "Teachers read progress for own classes"
  on assignment_progress for select using (
    exists (
      select 1 from assignments a
      where a.id = assignment_progress.assignment_id
        and public.is_class_teacher(a.class_id)
    )
  );

-- ── srs_cards ─────────────────────────────────────────────────
create policy "Users manage own SRS cards"
  on srs_cards for all using (auth.uid() = user_id);
create policy "Teachers read srs cards for enrolled students"
  on srs_cards for select using (
    public.is_teacher_of_student(user_id)
  );

-- ── encounters ────────────────────────────────────────────────
create policy "Students manage own encounters"
  on encounters for all using (auth.uid() = user_id);
create policy "Teachers read encounters for enrolled students"
  on encounters for select using (
    public.is_teacher_of_student(user_id)
  );

-- ── review_log ────────────────────────────────────────────────
create policy "Students insert own reviews"
  on review_log for insert with check (auth.uid() = user_id);
create policy "Students read own reviews"
  on review_log for select using (auth.uid() = user_id);
create policy "Teachers read reviews for enrolled students"
  on review_log for select using (
    public.is_teacher_of_student(user_id)
  );

-- ── user_progress ─────────────────────────────────────────────
create policy "Users manage own progress"
  on user_progress for all using (auth.uid() = user_id);
create policy "Teachers read enrolled students progress"
  on user_progress for select using (
    public.is_teacher_of_student(user_id)
  );

-- ── reading_sessions ──────────────────────────────────────────
create policy "Students manage own sessions"
  on reading_sessions for all using (auth.uid() = student_id);
create policy "Teachers read enrolled student sessions"
  on reading_sessions for select using (
    public.is_teacher_of_student(student_id)
  );

-- ── recordings ────────────────────────────────────────────────
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
      where rs.id = recordings.session_id
        and public.is_teacher_of_student(rs.student_id)
    )
  );

-- ── transcriptions ────────────────────────────────────────────
create policy "Students read own transcriptions"
  on transcriptions for select using (
    exists (
      select 1 from recordings r
      join reading_sessions rs on rs.id = r.session_id
      where r.id = transcriptions.recording_id
        and rs.student_id = auth.uid()
    )
  );

-- ── flag_events ───────────────────────────────────────────────
create policy "Students manage own flags"
  on flag_events for all using (auth.uid() = student_id);
create policy "Teachers write flags for enrolled students"
  on flag_events for insert with check (
    source = 'teacher'
    and source_user_id = auth.uid()
    and public.is_teacher_of_student(student_id)
  );
create policy "Teachers read flags for enrolled students"
  on flag_events for select using (
    auth.uid() = student_id
    or public.is_teacher_of_student(student_id)
  );

-- ── fluency_sessions ──────────────────────────────────────────
create policy "Students manage own fluency sessions"
  on fluency_sessions for all using (auth.uid() = student_id);
create policy "Teachers read enrolled student fluency"
  on fluency_sessions for select using (
    public.is_teacher_of_student(student_id)
  );

-- ── student_recordings ────────────────────────────────────────
create policy "Students manage own student recordings"
  on student_recordings for all using (auth.uid() = user_id);
create policy "Teachers read enrolled student recs"
  on student_recordings for select using (
    public.is_teacher_of_student(user_id)
  );


-- ************************************************************
-- PART 5: FUNCTIONS & TRIGGERS
-- ************************************************************

-- Auth trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Join class by code RPC
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


-- ************************************************************
-- PART 5: STORAGE BUCKETS & POLICIES
-- ************************************************************

insert into storage.buckets (id, name, public)
values ('curated-text-audio', 'curated-text-audio', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('student-recordings', 'student-recordings', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('text-covers', 'text-covers', true)
on conflict (id) do nothing;

-- Curated audio
create policy "Authenticated users read curated audio"
  on storage.objects for select
  using (bucket_id = 'curated-text-audio' and auth.role() = 'authenticated');

create policy "Admins upload curated audio"
  on storage.objects for insert
  with check (
    bucket_id = 'curated-text-audio'
    and public.is_admin()
  );

create policy "Admins update curated audio"
  on storage.objects for update
  using (
    bucket_id = 'curated-text-audio'
    and public.is_admin()
  );

create policy "Admins delete curated audio"
  on storage.objects for delete
  using (
    bucket_id = 'curated-text-audio'
    and public.is_admin()
  );

-- Student recordings
create policy "Students upload own recordings"
  on storage.objects for insert
  with check (
    bucket_id = 'student-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Students update own recordings"
  on storage.objects for update
  using (
    bucket_id = 'student-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Students read own recordings"
  on storage.objects for select
  using (
    bucket_id = 'student-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Teachers read enrolled student recordings storage"
  on storage.objects for select
  using (
    bucket_id = 'student-recordings'
    and exists (
      select 1 from class_enrollments ce
      join classes c on c.id = ce.class_id
      where ce.student_id = (storage.foldername(name))[1]::uuid
        and c.teacher_id = auth.uid()
    )
  );

-- Text covers (public bucket)
create policy "Anyone reads text covers"
  on storage.objects for select
  using (bucket_id = 'text-covers');

create policy "Admins upload text covers"
  on storage.objects for insert
  with check (bucket_id = 'text-covers' and public.is_admin());

create policy "Admins update text covers"
  on storage.objects for update
  using (bucket_id = 'text-covers' and public.is_admin());

create policy "Admins delete text covers"
  on storage.objects for delete
  using (bucket_id = 'text-covers' and public.is_admin());
