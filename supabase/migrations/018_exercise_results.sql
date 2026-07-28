-- 018: Exercise results — per-student per-text exercise scores
-- Stores student exercise completion for teacher visibility

create table if not exists exercise_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  text_id text not null,
  score integer not null,
  total integer not null,
  completed_at timestamptz default now(),
  answers jsonb,
  unique (user_id, text_id)
);

alter table exercise_results enable row level security;

create policy "Students manage own exercise results"
  on exercise_results for all using (auth.uid() = user_id);

create policy "Teachers read enrolled student exercise results"
  on exercise_results for select using (
    public.is_teacher_of_student(user_id)
  );
