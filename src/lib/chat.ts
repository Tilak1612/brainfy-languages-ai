// Client-side chat helper. Talks to /api/chat, which holds the API key
// server-side. This module never sees a key.
import { supabase } from "./supabase";

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

/**
 * Headers for a call to a metered endpoint. The server bills real money per
 * request, so it requires the caller's Supabase access token.
 */
export async function authHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Returns true if the server has an API key configured (real AI available). */
export async function checkAi(): Promise<boolean> {
  try {
    const r = await fetch("/api/health");
    if (!r.ok) return false;
    const j = await r.json();
    return !!j.ai;
  } catch {
    return false;
  }
}

/**
 * Stream a tutor reply. Calls onDelta with each text chunk as it arrives and
 * resolves with the full reply. Throws if the endpoint is unavailable.
 */
export interface PersonaRef {
  /** A key in the server's persona table, or "custom". Never prose. */
  tutorId: string;
  /** Only for tutorId === "custom": the four form fields, assembled server-side. */
  custom?: { name?: string; focus?: string; personality?: string; accent?: string };
  learner?: string;
}

export async function streamChat(
  persona: PersonaRef,
  messages: ChatMsg[],
  onDelta: (text: string) => void,
): Promise<string> {
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ ...persona, messages }),
  });
  if (r.status === 429) throw new Error("You've hit this hour's tutor limit — try again shortly.");
  if (!r.ok || !r.body) throw new Error(`chat failed (${r.status})`);
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onDelta(chunk);
  }
  return full;
}

/** Persona id for the Lesson screen's "Explain grammar" button. */
export const GRAMMAR_COACH: PersonaRef = { tutorId: "grammar-coach" };
