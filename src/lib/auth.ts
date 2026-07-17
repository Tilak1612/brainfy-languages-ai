// Auth session plumbing. Keeps a React-visible session, and drives the sync
// layer: pull the user's rows on sign-in, mirror changes while signed in, and
// clear everything on sign-out so the next person on this browser starts clean.
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, authEnabled } from "./supabase";
import { pull, startSync, stopSync } from "./sync";
import { resetToDefaults } from "./store";

export interface AuthState {
  /** null = still resolving; false = signed out. */
  session: Session | null | undefined;
  ready: boolean;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [ready, setReady] = useState(!authEnabled);

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      setReady(true);
      return;
    }

    let active = true;

    async function adopt(next: Session | null) {
      if (!active) return;
      setSession(next);
      if (next?.user) {
        await pull(next.user.id);
        startSync(next.user.id);
      } else {
        stopSync();
        resetToDefaults();
      }
      if (active) setReady(true);
    }

    void supabase.auth.getSession().then(({ data }) => adopt(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      void adopt(next);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      stopSync();
    };
  }, []);

  return { session, ready };
}

/**
 * The learner's name. Falls back to the design's persona in demo mode, so the
 * mock still reads as intended when there is no backend.
 */
export function useDisplayName(): string {
  const { session } = useAuth();
  if (!authEnabled) return "Sofia";
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
