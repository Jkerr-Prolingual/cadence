-- 023: Activity events for engagement tracking
-- Lightweight table recording student activity: word lookups, audio plays, sentence loops

create table if not exists activity_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  text_id    text not null,
  event_type text not null check (event_type in ('lookup', 'audio_play', 'sentence_loop')),
  created_at timestamptz not null default now()
);

create index idx_activity_events_user_created on activity_events (user_id, created_at desc);
create index idx_activity_events_text on activity_events (text_id);

alter table activity_events enable row level security;

-- Students insert their own events
create policy activity_events_insert on activity_events
  for insert with check (auth.uid() = user_id);

-- Students read their own events
create policy activity_events_select_own on activity_events
  for select using (auth.uid() = user_id);

-- Teachers read enrolled students' events
create policy activity_events_select_teacher on activity_events
  for select using (
    exists (
      select 1 from class_enrollments ce
      join classes c on c.id = ce.class_id
      where ce.student_id = activity_events.user_id
        and c.teacher_id = auth.uid()
    )
  );
