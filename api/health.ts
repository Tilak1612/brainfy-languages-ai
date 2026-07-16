import type { VercelRequest, VercelResponse } from "@vercel/node";

// Reports whether the real AI tutor is available (an API key is configured).
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("content-type", "application/json");
  res.status(200).end(JSON.stringify({ ai: !!process.env.ANTHROPIC_API_KEY }));
}
