-- Add archived_at column to assignments for soft-archive support
alter table assignments add column if not exists archived_at timestamptz;
