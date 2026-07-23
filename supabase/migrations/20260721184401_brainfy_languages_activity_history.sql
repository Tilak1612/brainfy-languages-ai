-- Per-day practice history and a conversation counter.
--
-- Without history there was no way to draw a real week chart (the UI shipped a
-- fixed array), no way to compute "vs last week", and no way to ever award the
-- "perfect week" badge. Stored as jsonb keyed YYYY-MM-DD rather than a rows
-- table: the client keeps a 60-day rolling window, so this is small and is
-- always read as a whole object alongside the rest of lang_progress.
alter table public.lang_progress
  add column if not exists conversations  integer not null default 0,
  add column if not exists daily_minutes  jsonb   not null default '{}'::jsonb;

alter table public.lang_progress
  add constraint lang_progress_daily_minutes_ck
  check (jsonb_typeof(daily_minutes) = 'object') not valid;

alter table public.lang_progress validate constraint lang_progress_daily_minutes_ck;
