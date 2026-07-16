// Client-side chat helper. Talks to the /api/chat dev-server middleware, which
// holds the API key server-side. This module never sees a key.

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

/** Returns true if the server has an API key configured (real AI available). */
export async function checkAi(): Promise<boolean> {
  try {
    const r = await fetch("/api/health");
    if (!r.ok) return false;
    const j = await r.json();
    return !!j.ai;
  } catch {
    return false;
  }
}

/**
 * Stream a tutor reply. Calls onDelta with each text chunk as it arrives and
 * resolves with the full reply. Throws if the endpoint is unavailable.
 */
export async function streamChat(
  system: string,
  messages: ChatMsg[],
  onDelta: (text: string) => void,
): Promise<string> {
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ system, messages }),
  });
  if (!r.ok || !r.body) throw new Error(`chat failed (${r.status})`);
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onDelta(chunk);
  }
  return full;
}

export const MAYA_SYSTEM = `You are Maya, a warm, patient English conversation tutor for an intermediate learner named Sofia (CEFR B2, native language Spanish).

Style:
- Speak natural, everyday English. Keep every reply to 1-3 short sentences.
- Ask one question at a time and let the learner do most of the talking.
- Be encouraging and human.

Correction policy:
- Do not interrupt the flow for small mistakes. When the learner makes an error, gently recast it: model the correct phrasing naturally in your reply rather than lecturing.
- Only stop to explain if an error blocks meaning.

Setting: a friendly everyday / cafe conversation for speaking practice.

Respond ONLY with your spoken reply to Sofia. No stage directions, no meta-commentary, no lists.`;
