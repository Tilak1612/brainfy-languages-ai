import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// Production chat endpoint. Calls Claude server-side using ANTHROPIC_API_KEY
// (set in the Vercel project's Environment Variables). The key is never sent to
// the browser. Returns the tutor's reply as plain text.
//
// Every call costs money, so the endpoint is gated: the caller must present a
// Supabase access token, and each user gets a bounded number of calls per hour.

// Pro: 40/hr is well above real usage (an engaged learner runs ~30 turns per
// DAY) while bounding the damage one account can do. At Opus 4.8 rates a turn
// costs ~$0.005, so the old 120/hr let one subscriber burn ~$147/month — more
// than any consumer price point recovers. 40/hr caps that at ~$49.
// Free: 10/day is ~$1.50/month of exposure per free account.
const PRO_HOURLY_LIMIT = Number(process.env.CHAT_HOURLY_LIMIT ?? 40);
const FREE_DAILY_LIMIT = Number(process.env.CHAT_FREE_DAILY_LIMIT ?? 10);

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

  // Quota. RLS scopes every statement here to this user.
  if (auth.client && auth.userId) {
    // Entitlement comes from our Stripe mirror, which only the webhook can
    // write — a user cannot promote themselves by editing their own row.
    const { data: sub } = await auth.client
      .from("lang_subscriptions")
      .select("status")
      .maybeSingle();
    const status = (sub as { status?: string } | null)?.status;
    // past_due keeps access through Stripe's retry window rather than cutting
    // off a paying customer on a transient card failure.
    const isPro = status === "trialing" || status === "active" || status === "past_due";

    const windowMs = isPro ? 3600_000 : 86_400_000;
    const limit = isPro ? PRO_HOURLY_LIMIT : FREE_DAILY_LIMIT;
    const since = new Date(Date.now() - windowMs).toISOString();

    const { count } = await auth.client
      .from("lang_api_usage")
      .select("id", { count: "exact", head: true })
      .eq("endpoint", "chat")
      .gte("created_at", since);

    if ((count ?? 0) >= limit) {
      res.setHeader("content-type", "application/json");
      res.status(429).end(
        JSON.stringify({
          error: isPro
            ? "You've hit this hour's limit — try again shortly."
            : `You've used your ${FREE_DAILY_LIMIT} free messages for today. Upgrade for more.`,
          upgrade: !isPro,
        }),
      );
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
