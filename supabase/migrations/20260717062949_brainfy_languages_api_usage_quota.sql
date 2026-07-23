-- Per-user usage log backing the API quota. Durable across serverless
-- instances, which an in-memory limiter cannot be.
create table if not exists public.lang_api_usage (
  id         bigserial   primary key,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  endpoint   text        not null,
  created_at timestamptz not null default now()
);

create index if not exists lang_api_usage_window_idx
  on public.lang_api_usage (user_id, created_at desc);

alter table public.lang_api_usage enable row level security;

-- Deliberately INSERT + SELECT only. With no UPDATE or DELETE policy those are
-- denied, so a user cannot erase their own usage rows to escape the quota.
create policy lang_api_usage_insert_own on public.lang_api_usage
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy lang_api_usage_select_own on public.lang_api_usage
  for select to authenticated using (user_id = (select auth.uid()));
