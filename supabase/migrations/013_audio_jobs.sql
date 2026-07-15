-- Audio generation jobs: tracks background audio generation requests
create table audio_jobs (
  id uuid primary key default gen_random_uuid(),
  text_id text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'complete', 'error')),
  error_message text,
  alignment jsonb,
  audio_path text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

alter table audio_jobs enable row level security;

create policy "Admins manage audio jobs"
  on audio_jobs for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
