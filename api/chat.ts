import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// Production chat endpoint. Calls Claude server-side using ANTHROPIC_API_KEY
// (set in the Vercel project's Environment Variables). The key is never sent to
// the browser. Returns the tutor's reply as plain text.
//
// Every call costs money, so the endpoint is gated: the caller must present a
// Supabase access token, and each user gets a bounded number of calls per hour.

const HOURLY_LIMIT = Number(process.env.CHAT_HOURLY_LIMIT ?? 120);

/** Resolve the caller from their bearer token, or null if not signed in. */
async function authenticate(req: VercelRequest) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  // No project configured => open demo mode; nothing to authenticate against.
  if (!url || !anon) return { ok: true as const, client: null, userId: null };

  const token = (req.headers.authorization ?? "").replace(/^Bearer /i, "");
  if (!token) return { ok: false as const };

  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { ok: false as const };
  return { ok: true as const, client, userId: data.user.id };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).end("method not allowed");
    return;
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(503).end("AI not configured");
    return;
  }

  const auth = await authenticate(req);
  if (!auth.ok) {
    res.status(401).end("sign in to use the tutor");
    return;
  }

  // Quota. RLS scopes both statements to this user.
  if (auth.client && auth.userId) {
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await auth.client
      .from("lang_api_usage")
      .select("id", { count: "exact", head: true })
      .eq("endpoint", "chat")
      .gte("created_at", since);
    if ((count ?? 0) >= HOURLY_LIMIT) {
      res.status(429).end("hourly limit reached — try again later");
      return;
    }
    await auth.client.from("lang_api_usage").insert({ user_id: auth.userId, endpoint: "chat" });
  }

  try {
    const { system, messages } = req.body ?? {};
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 400,
      thinking: { type: "disabled" },
      system,
      messages,
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.status(200).end(text);
  } catch (e) {
    res.status(500).end("error: " + (e instanceof Error ? e.message : String(e)));
  }
}
