import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminClient, authenticate, origin, stripeClient } from "./_stripe-shared.js";

// Opens the Stripe customer portal (cancel, switch plan, update card).
// The customer id comes from OUR record for the signed-in user, never from the
// request body — otherwise a caller could open any customer's billing portal.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).end("method not allowed");
    return;
  }
  const stripe = stripeClient();
  const admin = adminClient();
  if (!stripe || !admin) {
    res.status(503).end("billing not configured");
    return;
  }
  const user = await authenticate(req);
  if (!user) {
    res.status(401).end("sign in first");
    return;
  }

  try {
    const { data } = await admin
      .from("lang_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    const customer = (data as { stripe_customer_id?: string } | null)?.stripe_customer_id;
    if (!customer) {
      res.status(404).end("no billing account yet");
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: origin(req),
    });
    res.setHeader("content-type", "application/json");
    res.status(200).end(JSON.stringify({ url: session.url }));
  } catch (e) {
    res.status(500).end("error: " + (e instanceof Error ? e.message : String(e)));
  }
}
