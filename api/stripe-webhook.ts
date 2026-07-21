import type { VercelRequest, VercelResponse } from "@vercel/node";
import type Stripe from "stripe";
import { adminClient, stripeClient } from "./_stripe-shared.js";

// Stripe -> Supabase subscription mirror.
//
// This endpoint is the ONLY thing that can grant Pro, so it verifies Stripe's
// signature before trusting anything. Signature verification needs the exact
// bytes Stripe signed, so the body parser is disabled and the stream is read raw
// — a parsed-and-reserialized body produces a different MAC and always fails.
export const config = { api: { bodyParser: false } };

function rawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/** Stripe moved `current_period_end` onto subscription items; read either. */
function periodEnd(sub: Stripe.Subscription): string | null {
  const legacy = (sub as unknown as { current_period_end?: number }).current_period_end;
  const fromItem = sub.items?.data?.[0]?.current_period_end;
  const ts = legacy ?? fromItem;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).end("method not allowed");
    return;
  }
  const stripe = stripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    res.status(503).end("billing not configured");
    return;
  }

  // Authenticate BEFORE any other check. An earlier version tested the database
  // config first, so a forged payload was turned away by a missing env var
  // rather than by its bad signature — the right outcome for the wrong reason,
  // and one that would silently stop protecting anything once config was
  // complete. Untrusted input is rejected on its own merits here.
  let event: Stripe.Event;
  try {
    const sig = req.headers["stripe-signature"] as string;
    event = stripe.webhooks.constructEvent(await rawBody(req), sig, secret);
  } catch {
    res.status(400).end("invalid signature");
    return;
  }

  // Signature is good, so this really is Stripe. If we cannot write, return 503
  // so Stripe retries rather than dropping a genuine state change.
  const admin = adminClient();
  if (!admin) {
    res.status(503).end("billing not configured");
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.client_reference_id || s.metadata?.supabase_user_id;
        if (userId && s.customer) {
          // Record the customer mapping now so later events can resolve the
          // user even if their subscription metadata is missing.
          await admin.from("lang_subscriptions").upsert(
            {
              user_id: userId,
              stripe_customer_id: String(s.customer),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        let userId = sub.metadata?.supabase_user_id;

        // Fall back to the customer mapping written at checkout.
        if (!userId) {
          const { data } = await admin
            .from("lang_subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", String(sub.customer))
            .maybeSingle();
          userId = (data as { user_id?: string } | null)?.user_id;
        }
        if (!userId) break; // Not one of ours — ignore rather than guess.

        await admin.from("lang_subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: String(sub.customer),
            stripe_subscription_id: sub.id,
            // "deleted" still arrives with status canceled; trust Stripe's value.
            status: sub.status,
            price_id: sub.items?.data?.[0]?.price?.id ?? null,
            current_period_end: periodEnd(sub),
            cancel_at_period_end: Boolean(sub.cancel_at_period_end),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
        break;
      }

      default:
        break; // Unsubscribed event types are acknowledged, not processed.
    }

    res.status(200).end("ok");
  } catch (e) {
    // 500 tells Stripe to retry — better than silently dropping a state change.
    res.status(500).end("error: " + (e instanceof Error ? e.message : String(e)));
  }
}
