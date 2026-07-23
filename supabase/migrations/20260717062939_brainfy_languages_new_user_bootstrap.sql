-- Seed a profile/progress/settings row the moment a user signs up, so the app
-- never has to cope with a half-existing account on first load.
create or replace function public.lang_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.lang_profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.lang_progress (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.lang_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists lang_on_auth_user_created on auth.users;
create trigger lang_on_auth_user_created
  after insert on auth.users
  for each row execute function public.lang_handle_new_user();

-- Trigger function only. SECURITY DEFINER is needed so the auth.users trigger
-- can write into public.*, but that also exposes it at
-- /rest/v1/rpc/lang_handle_new_user; nobody should invoke it directly.
revoke all on function public.lang_handle_new_user() from public, anon, authenticated;
