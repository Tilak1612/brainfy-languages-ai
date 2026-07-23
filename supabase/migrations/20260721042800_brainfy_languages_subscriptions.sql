-- Stripe subscription state, mirrored from webhook events.
--
-- SECURITY: this table decides who gets paid features, so the owner must NOT be
-- able to write it — a user who could UPDATE their own row would simply set
-- status='active' and grant themselves Pro. Only SELECT is granted to
-- `authenticated`; every write goes through the webhook using the service-role
-- key, which bypasses RLS.
create table if not exists public.lang_subscriptions (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  -- Stripe's own vocabulary: trialing | active | past_due | canceled |
  -- incomplete | incomplete_expired | unpaid | paused
  status                 text        not null default 'none',
  price_id               text,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean     not null default false,
  updated_at             timestamptz not null default now()
);

-- The webhook looks users up by Stripe's IDs, not ours.
create index if not exists lang_subscriptions_customer_idx
  on public.lang_subscriptions (stripe_customer_id);

alter table public.lang_subscriptions enable row level security;

-- Read-only for the owner. No insert/update/delete policy exists, so those are
-- denied for `authenticated` even though the rows are theirs.
create policy lang_subscriptions_select_own on public.lang_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

-- Single source of truth for "is this user paid?", used by the API quota gate.
-- Trialing counts as entitled; past_due keeps access during Stripe's retry
-- window rather than cutting a paying customer off on a transient card failure.
create or replace function public.lang_is_pro(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lang_subscriptions s
    where s.user_id = uid
      and s.status in ('trialing', 'active', 'past_due')
  );
$$;

revoke all on function public.lang_is_pro(uuid) from public, anon;
