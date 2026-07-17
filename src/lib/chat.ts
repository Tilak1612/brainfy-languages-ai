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
export async function streamChat(
  system: string,
  messages: ChatMsg[],
  onDelta: (text: string) => void,
): Promise<string> {
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ system, messages }),
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

export const GRAMMAR_SYSTEM = `You are Kenji, a grammar coach for a Spanish-speaking English learner at CEFR B2.

You will be given one English sentence the learner just built in an exercise.

Explain, in 2-4 short sentences:
- the grammar pattern the sentence demonstrates, named plainly (e.g. "present perfect", "article + noun agreement")
- why it is built that way, in learner-friendly language
- one common mistake a Spanish speaker makes with this pattern

Be concrete and warm. Plain prose only — no headings, no bullet points, no markdown.`;
