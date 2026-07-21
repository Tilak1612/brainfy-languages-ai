import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { resolveSystem } from "./_personas.js";

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

// Payload ceilings. A real tutor turn is a sentence or two; these are generous
// for legitimate use and make the token cost of any single call bounded.
const MAX_TURNS = 40;
const MAX_MSG_CHARS = 4000;
const MAX_TOTAL_CHARS = 40_000;

/** Resolve the caller from their bearer token, or null if not signed in. */
async function authenticate(req: VercelRequest) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  // FAIL CLOSED. This previously returned ok:true when the Supabase vars were
  // absent, which skipped auth AND the quota entirely — one env-var scoping
  // mistake (VITE_ vars are build-time by convention; scoping one to "Build
  // only" is a plausible cleanup) silently exposed ANTHROPIC_API_KEY to the
  // internet, with no symptom but a bill. Anonymous access now requires an
  // explicit opt-in that nobody sets by accident.
  if (!url || !anon) {
    if (process.env.ALLOW_ANONYMOUS_AI === "1") {
      return { ok: true as const, client: null, userId: null };
    }
    return { ok: false as const };
  }

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
      .eq("user_id", auth.userId)
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
      .eq("user_id", auth.userId)
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
    const { tutorId, custom, learner, messages } = req.body ?? {};

    // The system prompt is resolved from a server-side table. The client sends
    // an ID; it can never send prose.
    const system = resolveSystem(tutorId, custom, learner);
    if (!system) {
      res.status(400).end("unknown tutor");
      return;
    }

    // Validate the transcript. Without these caps a single ~4 MB body is on the
    // order of a million input tokens, which made the per-request quota
    // meaningless as a cost control.
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_TURNS) {
      res.status(400).end("bad messages");
      return;
    }
    let total = 0;
    for (const m of messages) {
      if (
        !m ||
        (m.role !== "user" && m.role !== "assistant") ||
        typeof m.content !== "string" ||
        m.content.length > MAX_MSG_CHARS
      ) {
        res.status(400).end("bad message");
        return;
      }
      total += m.content.length;
    }
    if (total > MAX_TOTAL_CHARS) {
      res.status(400).end("conversation too long");
      return;
    }
    // A trailing assistant turn is a prefill: "Sure, here's how:" is a standard
    // jailbreak that works even with the system prompt locked down.
    if (messages[messages.length - 1].role !== "user") {
      res.status(400).end("last message must be from the user");
      return;
    }

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
    // Detail stays server-side: SDK errors embed request ids, org identifiers
    // and model config that shouldn't be handed to an anonymous caller.
    console.error("/api/chat failed:", e);
    res.status(500).end("internal error");
  }
}
