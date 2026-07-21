// Shared helpers for the Stripe endpoints.
//
// Unlike the Python functions (whose runtime can't import siblings), Vercel's
// Node runtime bundles imported modules, so a shared file is fine here.
import type { VercelRequest } from "@vercel/node";
import Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Price IDs live in env, never hardcoded: test-mode IDs are invalid against a
 *  live secret key, so going live must be an env change, not a code change. */
export const PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY ?? "";
export const PRICE_ANNUAL = process.env.STRIPE_PRICE_ANNUAL ?? "";
export const TRIAL_DAYS = Number(process.env.STRIPE_TRIAL_DAYS ?? 14);

export function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

/**
 * Service-role Supabase client. Bypasses RLS — use ONLY in the webhook, which
 * must write subscription rows that the user themselves is forbidden to write.
 * Never construct this from a user-supplied token.
 */
export function adminClient(): SupabaseClient | null {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface Caller {
  id: string;
  email?: string;
}

/** Resolve the signed-in caller from their bearer token, or null. */
export async function authenticate(req: VercelRequest): Promise<Caller | null> {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const token = (req.headers.authorization ?? "").replace(/^Bearer /i, "");
  if (!token) return null;
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? undefined };
}

/** The site's absolute origin, for Stripe return URLs. */
export function origin(req: VercelRequest): string {
  const envUrl = process.env.PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  return `${proto}://${host}`;
}
