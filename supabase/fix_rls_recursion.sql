-- Fix: infinite recursion between classes ↔ class_enrollments policies.
-- SECURITY DEFINER functions bypass RLS, breaking the cycle.
-- Run this in the Supabase SQL Editor.

-- ============================================================
-- 1. Helper functions (bypass RLS)
-- ============================================================

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

-- ============================================================
-- 2. Drop the circular policies
-- ============================================================

-- classes
drop policy if exists "Students read enrolled classes" on classes;

-- class_enrollments
drop policy if exists "Teachers read class enrollments" on class_enrollments;
drop policy if exists "Teachers manage enrollments for own classes" on class_enrollments;

-- all teacher-read policies that join class_enrollments + classes
drop policy if exists "Teachers read enrolled student profiles" on profiles;
drop policy if exists "Teachers read srs cards for enrolled students" on srs_cards;
drop policy if exists "Teachers read encounters for enrolled students" on encounters;
drop policy if exists "Teachers read reviews for enrolled students" on review_log;
drop policy if exists "Teachers read enrolled students progress" on user_progress;
drop policy if exists "Teachers read enrolled student sessions" on reading_sessions;
drop policy if exists "Teachers read enrolled student recordings" on recordings;
drop policy if exists "Teachers read flags for enrolled students" on flag_events;
drop policy if exists "Teachers write flags for enrolled students" on flag_events;
drop policy if exists "Teachers read enrolled student fluency" on fluency_sessions;
drop policy if exists "Teachers read enrolled student recs" on student_recordings;
drop policy if exists "Teachers manage assignments for own classes" on assignments;
drop policy if exists "Teachers read progress for own classes" on assignment_progress;

-- ============================================================
-- 3. Recreate policies using helper functions
-- ============================================================

-- classes: students read via helper
create policy "Students read enrolled classes"
  on classes for select using (
    public.is_class_member(id)
  );

-- class_enrollments: teachers read/delete via helper
create policy "Teachers read class enrollments"
  on class_enrollments for select using (
    public.is_class_teacher(class_id)
  );
create policy "Teachers manage enrollments for own classes"
  on class_enrollments for delete using (
    public.is_class_teacher(class_id)
  );

-- profiles: teachers read enrolled students
create policy "Teachers read enrolled student profiles"
  on profiles for select using (
    public.is_teacher_of_student(id)
  );

-- assignments: teachers manage for own classes
create policy "Teachers manage assignments for own classes"
  on assignments for all using (
    public.is_class_teacher(class_id)
  );

-- assignment_progress: teachers read
create policy "Teachers read progress for own classes"
  on assignment_progress for select using (
    exists (
      select 1 from assignments a
      where a.id = assignment_progress.assignment_id
        and public.is_class_teacher(a.class_id)
    )
  );

-- srs_cards
create policy "Teachers read srs cards for enrolled students"
  on srs_cards for select using (
    public.is_teacher_of_student(user_id)
  );

-- encounters
create policy "Teachers read encounters for enrolled students"
  on encounters for select using (
    public.is_teacher_of_student(user_id)
  );

-- review_log
create policy "Teachers read reviews for enrolled students"
  on review_log for select using (
    public.is_teacher_of_student(user_id)
  );

-- user_progress
create policy "Teachers read enrolled students progress"
  on user_progress for select using (
    public.is_teacher_of_student(user_id)
  );

-- reading_sessions
create policy "Teachers read enrolled student sessions"
  on reading_sessions for select using (
    public.is_teacher_of_student(student_id)
  );

-- recordings
create policy "Teachers read enrolled student recordings"
  on recordings for select using (
    exists (
      select 1 from reading_sessions rs
      where rs.id = recordings.session_id
        and public.is_teacher_of_student(rs.student_id)
    )
  );

-- flag_events
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

-- fluency_sessions (column is user_id per migration 004)
create policy "Teachers read enrolled student fluency"
  on fluency_sessions for select using (
    public.is_teacher_of_student(user_id)
  );

-- student_recordings
create policy "Teachers read enrolled student recs"
  on student_recordings for select using (
    public.is_teacher_of_student(user_id)
  );
