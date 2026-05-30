-- 002: Add assignments, assignment_progress, encounters, review_log,
--      extend srs_cards, create auth trigger, add missing RLS policies,
--      and set up storage buckets.

-- ============================================================
-- ASSIGNMENTS
-- ============================================================
create table if not exists assignments (
  id text primary key,
  class_id uuid references classes(id) on delete cascade not null,
  text_id text not null,
  title text not null,
  tasks jsonb not null default '{}',
  due_date date,
  created_at timestamptz default now()
);

alter table assignments enable row level security;

create policy "Teachers manage assignments for own classes"
  on assignments for all using (
    exists (
      select 1 from classes
      where classes.id = assignments.class_id
        and classes.teacher_id = auth.uid()
    )
  );

create policy "Students read assignments for enrolled classes"
  on assignments for select using (
    exists (
      select 1 from class_enrollments ce
      where ce.class_id = assignments.class_id
        and ce.student_id = auth.uid()
    )
  );

-- ============================================================
-- ASSIGNMENT PROGRESS
-- ============================================================
create table if not exists assignment_progress (
  id text primary key,
  assignment_id text references assignments(id) on delete cascade not null,
  student_id uuid references profiles(id) not null,
  completed jsonb not null default '{}',
  updated_at timestamptz default now()
);

alter table assignment_progress enable row level security;

create policy "Students manage own assignment progress"
  on assignment_progress for all using (auth.uid() = student_id);

create policy "Teachers read progress for own classes"
  on assignment_progress for select using (
    exists (
      select 1 from assignments a
      join classes c on c.id = a.class_id
      where a.id = assignment_progress.assignment_id
        and c.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- ENCOUNTERS
-- ============================================================
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

alter table encounters enable row level security;

create policy "Students manage own encounters"
  on encounters for all using (auth.uid() = user_id);

create policy "Teachers read encounters for enrolled students"
  on encounters for select using (
    exists (
      select 1 from class_enrollments ce
      join classes c on c.id = ce.class_id
      where ce.student_id = encounters.user_id
        and c.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- REVIEW LOG
-- ============================================================
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

alter table review_log enable row level security;

create policy "Students insert own reviews"
  on review_log for insert with check (auth.uid() = user_id);

create policy "Students read own reviews"
  on review_log for select using (auth.uid() = user_id);

create policy "Teachers read reviews for enrolled students"
  on review_log for select using (
    exists (
      select 1 from class_enrollments ce
      join classes c on c.id = ce.class_id
      where ce.student_id = review_log.user_id
        and c.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- SRS CARDS — add columns the app needs
-- ============================================================
alter table srs_cards add column if not exists front text;
alter table srs_cards add column if not exists back text;
alter table srs_cards add column if not exists cefr text;
alter table srs_cards add column if not exists spanish text;
alter table srs_cards add column if not exists image_url text;
alter table srs_cards add column if not exists image_attribution text;
alter table srs_cards add column if not exists text_id text;
alter table srs_cards add column if not exists text_title text;

-- Update card_type constraint: the app creates 'spanish' cards, not 'dual'
alter table srs_cards drop constraint if exists srs_cards_card_type_check;
alter table srs_cards add constraint srs_cards_card_type_check
  check (card_type in ('spanish', 'cloze', 'dual', 'definition'));

-- Teachers need to see enrolled students' flashcards
create policy "Teachers read srs cards for enrolled students"
  on srs_cards for select using (
    exists (
      select 1 from class_enrollments ce
      join classes c on c.id = ce.class_id
      where ce.student_id = srs_cards.user_id
        and c.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- MISSING POLICIES ON EXISTING TABLES
-- ============================================================

-- Teachers read profiles of enrolled students
create policy "Teachers read enrolled student profiles"
  on profiles for select using (
    exists (
      select 1 from class_enrollments ce
      join classes c on c.id = ce.class_id
      where ce.student_id = profiles.id
        and c.teacher_id = auth.uid()
    )
  );

-- Students can read classes they're enrolled in
create policy "Students read enrolled classes"
  on classes for select using (
    exists (
      select 1 from class_enrollments
      where class_id = classes.id
        and student_id = auth.uid()
    )
  );

-- Students can insert their own enrollment row (for join-by-code)
create policy "Students insert own enrollment"
  on class_enrollments for insert with check (auth.uid() = student_id);

-- Teachers can delete enrollments from their own classes
create policy "Teachers manage enrollments for own classes"
  on class_enrollments for delete using (
    exists (
      select 1 from classes
      where classes.id = class_enrollments.class_id
        and classes.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- AUTH TRIGGER: auto-create profile on signup
-- ============================================================
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

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public)
values ('curated-text-audio', 'curated-text-audio', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('student-recordings', 'student-recordings', false)
on conflict (id) do nothing;

-- Curated audio: all authenticated users can read
create policy "Authenticated users read curated audio"
  on storage.objects for select
  using (bucket_id = 'curated-text-audio' and auth.role() = 'authenticated');

-- Curated audio: admins can upload
create policy "Admins upload curated audio"
  on storage.objects for insert
  with check (
    bucket_id = 'curated-text-audio'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Student recordings: students upload to their own folder
create policy "Students upload own recordings"
  on storage.objects for insert
  with check (
    bucket_id = 'student-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Student recordings: students read own
create policy "Students read own recordings"
  on storage.objects for select
  using (
    bucket_id = 'student-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Student recordings: teachers read enrolled students'
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
