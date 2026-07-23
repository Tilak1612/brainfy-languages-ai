-- lang_is_pro(uid) takes an arbitrary user id and is SECURITY DEFINER, so
-- exposing it at /rest/v1/rpc/lang_is_pro let any signed-in user probe whether
-- ANOTHER user subscribes. It exists for server-side and in-SQL use only; the
-- app reads lang_subscriptions directly under RLS instead.
revoke all on function public.lang_is_pro(uuid) from public, anon, authenticated;
