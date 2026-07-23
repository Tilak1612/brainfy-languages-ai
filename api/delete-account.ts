import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticate, adminClient, stripeClient } from "./_stripe-shared.js";

// Permanent account deletion, initiated by the account owner.
//
// The client cannot do this itself: deleting an auth.users row needs the
// service-role key, which never touches the browser. So the browser proves who
// it is with its bearer token, and this endpoint — and only after verifying
// that token — performs the delete with admin rights.
//
// Every lang_* table references auth.users(id) ON DELETE CASCADE, so removing
// the auth user removes all of the learner's data in one step (profile,
// progress, SRS cards, custom tutors, settings, usage, subscription row).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  // Only the signed-in owner can delete their own account. The id comes from the
  // verified token, never from the request body — so nobody can pass someone
  // else's id and delete their account.
  const caller = await authenticate(req);
  if (!caller) {
    res.status(401).json({ error: "sign in first" });
    return;
  }

  const admin = adminClient();
  if (!admin) {
    // Fail closed rather than pretend success.
    res.status(500).json({ error: "account deletion is not configured" });
    return;
  }

  // Best effort: cancel any live Stripe subscription first, so a deleted account
  // is never billed again. A Stripe hiccup must not block the deletion the user
  // explicitly asked for, so this is wrapped and only logged on failure.
  try {
    const stripe = stripeClient();
    if (stripe) {
      const { data } = await admin
        .from("lang_subscriptions")
        .select("stripe_subscription_id")
        .eq("user_id", caller.id)
        .maybeSingle();
      const subId = (data as { stripe_subscription_id?: string } | null)?.stripe_subscription_id;
      if (subId) await stripe.subscriptions.cancel(subId);
    }
  } catch (e) {
    console.error("delete-account: could not cancel Stripe subscription", e);
  }

  const { error } = await admin.auth.admin.deleteUser(caller.id);
  if (error) {
    console.error("delete-account: deleteUser failed", error);
    res.status(500).json({ error: "could not delete account" });
    return;
  }

  res.status(200).json({ ok: true });
}
