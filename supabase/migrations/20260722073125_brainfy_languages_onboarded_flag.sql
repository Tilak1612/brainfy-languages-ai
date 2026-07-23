-- First-run flag. Without it a new account landed straight on a dashboard of
-- zeros with no explanation of what the product does or where to begin.
-- Defaults false so every existing account also sees the intro once.
alter table public.lang_progress
  add column if not exists onboarded boolean not null default false;
