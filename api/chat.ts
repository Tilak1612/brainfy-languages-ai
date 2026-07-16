import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";

// Production chat endpoint. Calls Claude server-side using ANTHROPIC_API_KEY
// (set in the Vercel project's Environment Variables). The key is never sent to
// the browser. Returns the tutor's reply as plain text.
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
