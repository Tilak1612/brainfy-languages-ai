// Auth session plumbing.
//
// The session lives at module scope, NOT in a hook. useAuth() is consumed by
// several components at once (App, Sidebar, useDisplayName in Dashboard and
// Voice), and an earlier version drove pull/startSync from inside each
// consumer's useEffect. That meant every consumer opened its own subscription
// and, worse, its cleanup called stopSync() — so simply navigating away from
// the dashboard tore down syncing for the whole app and progress silently
// stopped reaching Postgres. One module-level owner, one sync lifecycle.
import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, authEnabled } from "./supabase";
import { pull, startSync, stopSync } from "./sync";
import { resetToDefaults } from "./store";

export interface AuthState {
  /** undefined = still resolving; null = signed out. */
  session: Session | null | undefined;
  ready: boolean;
}

// Snapshot must be referentially stable between changes for useSyncExternalStore.
let snapshot: AuthState = { session: undefined, ready: !authEnabled };
const listeners = new Set<() => void>();

function emit(next: AuthState) {
  snapshot = next;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

async function adopt(next: Session | null) {
  if (next?.user) {
    await pull(next.user.id);
    startSync(next.user.id);
  } else {
    stopSync();
    resetToDefaults();
  }
  emit({ session: next, ready: true });
}

let started = false;

/** Begin resolving the session. Idempotent; safe to call from render. */
function start() {
  if (started) return;
  started = true;
  if (!supabase) {
    emit({ session: null, ready: true });
    return;
  }
  void supabase.auth.getSession().then(({ data }) => adopt(data.session));
  supabase.auth.onAuthStateChange((_event, next) => {
    void adopt(next);
  });
}

start();

export function useAuth(): AuthState {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => snapshot,
  );
}

/**
 * The learner's name. Only signed-in users have a real name; the fallback is an
 * obvious placeholder ("Demo") shown solely in local/preview builds with no
 * backend. It used to be "Sofia", which external reviewers repeatedly mistook
 * for a real account or even a tutor — a placeholder should look like one.
 */
export function useDisplayName(): string {
  const { session } = useAuth();
  if (!authEnabled) return "Demo";
  const meta = session?.user?.user_metadata as { display_name?: string } | undefined;
  const name = meta?.display_name || session?.user?.email?.split("@")[0] || "there";
  return name.split(/[\s._-]+/)[0] || "there";
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error("auth not configured");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(email: string, password: string, displayName: string) {
  if (!supabase) throw new Error("auth not configured");
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw error;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}
