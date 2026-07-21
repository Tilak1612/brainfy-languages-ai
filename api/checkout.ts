import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  authenticate,
  origin,
  stripeClient,
  PRICE_MONTHLY,
  PRICE_ANNUAL,
  TRIAL_DAYS,
} from "./_stripe-shared.js";

// Creates a Stripe Checkout Session for the signed-in user and returns its URL.
// The 14-day trial is set here rather than on the price object, so changing it
// doesn't require creating new prices.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).end("method not allowed");
    return;
  }
  const stripe = stripeClient();
  if (!stripe || !PRICE_MONTHLY || !PRICE_ANNUAL) {
    res.status(503).end("billing not configured");
    return;
  }
  const user = await authenticate(req);
  if (!user) {
    res.status(401).end("sign in to subscribe");
    return;
  }

  try {
    // The client picks a plan, never a price ID — otherwise a caller could
    // substitute any price in the account, including a $0 one.
    const plan = (req.body?.plan ?? "monthly") as "monthly" | "annual";
    const price = plan === "annual" ? PRICE_ANNUAL : PRICE_MONTHLY;
    const site = origin(req);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      // Ties the Stripe customer to our user so the webhook can map it back.
      client_reference_id: user.id,
      customer_email: user.email,
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: { supabase_user_id: user.id },
      },
      metadata: { supabase_user_id: user.id },
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
      success_url: `${site}/?checkout=success`,
      cancel_url: `${site}/?checkout=cancelled`,
    });

    res.setHeader("content-type", "application/json");
    res.status(200).end(JSON.stringify({ url: session.url }));
  } catch (e) {
    res.status(500).end("error: " + (e instanceof Error ? e.message : String(e)));
  }
}
