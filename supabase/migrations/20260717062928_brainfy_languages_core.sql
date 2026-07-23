-- Brainfy Languages AI — core tables.
-- Dedicated project, so no prefix is strictly needed, but `lang_*` is kept for
-- continuity with the migration history and the app's queries.

-- ---- profile -------------------------------------------------------------
create table if not exists public.lang_profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text        not null default 'Learner',
  cefr_level    text        not null default 'B2',
  learning_lang text        not null default 'EN',
  created_at    timestamptz not null default now()
);

-- ---- progress (mirrors the client State object) ---------------------------
create table if not exists public.lang_progress (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  xp                integer     not null default 0,
  coins             integer     not null default 0,
  streak            integer     not null default 0,
  last_active_date  date,
  minutes_today     integer     not null default 0,
  daily_goal_min    integer     not null default 25,
  today_date        date        not null default current_date,
  skills            jsonb       not null default '{"speaking":0,"listening":0,"vocabulary":0,"grammar":0,"reading":0}'::jsonb,
  words_learned     integer     not null default 0,
  achievements      text[]      not null default '{}',
  lessons_completed integer     not null default 0,
  updated_at        timestamptz not null default now()
);

-- ---- spaced repetition ----------------------------------------------------
create table if not exists public.lang_srs_cards (
  user_id       uuid        not null references auth.users (id) on delete cascade,
  card_id       text        not null,
  ease          real        not null default 2.5,
  interval_days real        not null default 0,
  due_ts        bigint      not null,
  reps          integer     not null default 0,
  lapses        integer     not null default 0,
  updated_at    timestamptz not null default now(),
  primary key (user_id, card_id)
);

-- Review fetches "my cards that are due", so index that access path.
create index if not exists lang_srs_cards_due_idx
  on public.lang_srs_cards (user_id, due_ts);

-- ---- user-built tutors ----------------------------------------------------
create table if not exists public.lang_custom_tutors (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  tutor_id   text        not null,
  name       text        not null,
  initials   text        not null,
  role       text        not null,
  grad       text        not null,
  blurb      text        not null,
  badge      text        not null,
  system     text        not null,
  created_at timestamptz not null default now(),
  primary key (user_id, tutor_id)
);

-- ---- which tutor is active ------------------------------------------------
create table if not exists public.lang_settings (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  active_tutor_id  text        not null default 'Maya',
  updated_at       timestamptz not null default now()
);

-- ---- RLS: every table is per-user, owner-only ----------------------------
alter table public.lang_profiles      enable row level security;
alter table public.lang_progress      enable row level security;
alter table public.lang_srs_cards     enable row level security;
alter table public.lang_custom_tutors enable row level security;
alter table public.lang_settings      enable row level security;

create policy lang_profiles_owner on public.lang_profiles
  for all to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy lang_progress_owner on public.lang_progress
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy lang_srs_cards_owner on public.lang_srs_cards
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy lang_custom_tutors_owner on public.lang_custom_tutors
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy lang_settings_owner on public.lang_settings
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
