// Supabase client. The app degrades gracefully: if these env vars are absent
// (e.g. a local checkout with no project), `supabase` is null, auth is skipped
// and progress falls back to localStorage — the same pattern as /api/health
// gating the AI and voice features.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;

/** True when a Supabase project is configured, so accounts are available. */
export const authEnabled = Boolean(supabase);
