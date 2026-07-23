import type { VercelRequest, VercelResponse } from "@vercel/node";

// Reports which capabilities are configured, by env presence only. Never leaks a
// key or its value — each field is a boolean. `stripe` means all four billing
// vars are set; it does NOT prove the keys are valid or in live mode (a real
// checkout is the only proof of that).
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("content-type", "application/json");
  res.status(200).end(
    JSON.stringify({
      ai: !!process.env.ANTHROPIC_API_KEY,
      voice: !!process.env.NVIDIA_API_KEY,
      stripe: !!(
        process.env.STRIPE_SECRET_KEY &&
        process.env.STRIPE_PRICE_MONTHLY &&
        process.env.STRIPE_PRICE_ANNUAL &&
        process.env.STRIPE_WEBHOOK_SECRET
      ),
    }),
  );
}
