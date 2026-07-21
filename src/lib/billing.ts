// Subscription state + Stripe entry points.
//
// The client only ever *reads* entitlement — `lang_subscriptions` is written
// exclusively by the Stripe webhook, so nothing here can grant Pro. Treat the
// value as display state; the API re-checks it server-side on every metered call.
import { useEffect, useState } from "react";
import { supabase, authEnabled } from "./supabase";
import { useAuth } from "./auth";
import { authHeaders } from "./chat";

export type PlanStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused";

export interface Billing {
  status: PlanStatus;
  isPro: boolean;
  /** True once we've actually checked, so the UI can avoid flashing "Free". */
  ready: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}

const ENTITLED: PlanStatus[] = ["trialing", "active", "past_due"];

export function useBilling(): Billing {
  const { session } = useAuth();
  const [state, setState] = useState<Billing>({
    status: "none",
    isPro: false,
    ready: !authEnabled,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
  });

  useEffect(() => {
    if (!supabase || !session?.user) {
      setState((s) => ({ ...s, status: "none", isPro: false, ready: true }));
      return;
    }
    let active = true;
    void supabase
      .from("lang_subscriptions")
      .select("status, cancel_at_period_end, current_period_end")
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const row = data as {
          status?: PlanStatus;
          cancel_at_period_end?: boolean;
          current_period_end?: string;
        } | null;
        const status = row?.status ?? "none";
        setState({
          status,
          isPro: ENTITLED.includes(status),
          ready: true,
          cancelAtPeriodEnd: Boolean(row?.cancel_at_period_end),
          currentPeriodEnd: row?.current_period_end ?? null,
        });
      });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  return state;
}

async function post(path: string, body?: unknown): Promise<string | null> {
  const r = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(body ?? {}),
  });
  if (!r.ok) return null;
  const j = (await r.json()) as { url?: string };
  return j.url ?? null;
}

/** Send the user to Stripe Checkout. Returns false if billing isn't configured. */
export async function startCheckout(plan: "monthly" | "annual" = "monthly") {
  const url = await post("/api/checkout", { plan });
  if (!url) return false;
  window.location.href = url;
  return true;
}

/** Open the Stripe customer portal (cancel, switch plan, update card). */
export async function openPortal() {
  const url = await post("/api/portal");
  if (!url) return false;
  window.location.href = url;
  return true;
}
