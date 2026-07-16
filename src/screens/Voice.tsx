import { useEffect, useRef, useState } from "react";
import { MicIcon, MicOffIcon, HangupIcon, SettingsBurstIcon, SparkleIcon } from "../components/icons";
import { cafeScript } from "../content/learning";
import { actions } from "../lib/store";
import { checkAi, streamChat, MAYA_SYSTEM, type ChatMsg } from "../lib/chat";

interface Msg {
  from: "maya" | "user";
  text: string;
  ok?: boolean;
}

const waveDelays = ["0s", ".15s", ".3s", ".45s", ".6s", ".75s", ".9s"];
const GREETING = "Hi Sofia! Great to see you. What did you get up to today?";

export default function Voice() {
  const [aiReady, setAiReady] = useState<boolean | null>(null);

  useEffect(() => {
    checkAi().then(setAiReady);
  }, []);

  // ---- shared UI: call panel chrome ----
  const [done, setDone] = useState(false);
  const [tip, setTip] = useState(
    'Use polite frames like "Could I…, please?" — Maya remembers what you practice.',
  );

  // ---- scripted mode state ----
  const [step, setStep] = useState(0);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "maya", text: cafeScript[0].maya }]);

  // ---- AI mode state ----
  const [aiMsgs, setAiMsgs] = useState<Msg[]>([{ from: "maya", text: GREETING }]);
  const apiMsgs = useRef<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [aiMsgs, msgs]);

  // ---- scripted choose ----
  const current = cafeScript[step];
  function choose(opt: { text: string; good: boolean; tip?: string }) {
    const next: Msg[] = [...msgs, { from: "user", text: opt.text, ok: opt.good }];
    if (!opt.good) {
      setMsgs(next);
      setTip(opt.tip ?? "Almost — try a more natural phrasing.");
      actions.recordAnswer("speaking", false);
      return;
    }
    actions.recordAnswer("speaking", true);
    actions.addXp(8);
    const n = step + 1;
    if (n >= cafeScript.length) {
      setMsgs([...next, { from: "maya", text: "¡Perfecto! You ordered like a local. See you next session." }]);
      setTip("Great session — your café vocabulary is getting stronger.");
      actions.registerActivity(5);
      setDone(true);
    } else {
      setMsgs([...next, { from: "maya", text: cafeScript[n].maya }]);
      setTip("Nice — natural and polite. Keep it up.");
      setStep(n);
    }
  }

  // ---- AI send ----
  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    setAiMsgs((m) => [...m, { from: "user", text }, { from: "maya", text: "" }]);
    apiMsgs.current.push({ role: "user", content: text });
    actions.recordAnswer("speaking", true);
    try {
      const reply = await streamChat(MAYA_SYSTEM, apiMsgs.current, (delta) => {
        setAiMsgs((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { from: "maya", text: copy[copy.length - 1].text + delta };
          return copy;
        });
      });
      apiMsgs.current.push({ role: "assistant", content: reply });
      actions.addXp(6);
      actions.registerActivity(1);
      setTip("Maya is a live AI tutor — speak freely and she'll adapt to you.");
    } catch {
      setAiMsgs((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { from: "maya", text: "(Connection issue — try again.)" };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  const transcript = aiReady ? aiMsgs : msgs;
  const liveLabel = aiReady ? (busy ? "Live · thinking…" : "Live · AI tutor") : done ? "Session ended" : "Live · 02:14";

  return (
    <div className="anim-fade mx-auto grid max-w-[1180px] grid-cols-[1.15fr_.85fr] gap-5">
      {/* Live call panel */}
      <div className="relative flex min-h-[560px] flex-col items-center overflow-hidden rounded-[24px] bg-[linear-gradient(160deg,#211f2b,#141319)] p-[30px] text-white">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-[11px]">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[13px] bg-[linear-gradient(135deg,#8B7CF6,#5B4BE8)] font-display text-[17px] font-extrabold">
              M
            </div>
            <div className="leading-[1.2]">
              <div className="text-[15px] font-bold">Maya</div>
              <div className="flex items-center gap-[5px] text-[12px] text-mint">
                <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                {liveLabel}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-[7px] rounded-full border border-white/[.12] bg-white/[.08] px-3 py-1.5 text-[12px] font-semibold text-[#c9c7d4]">
            {aiReady ? "Free conversation · B2" : "Café role-play · A2"}
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-[26px]">
          <div className="relative flex h-[200px] w-[200px] items-center justify-center">
            {!done && (
              <>
                <span className="absolute inset-0 rounded-full border-2 border-[rgba(139,124,246,.5)]" style={{ animation: "brf-ring 2.4s ease-out infinite" }} />
                <span className="absolute inset-0 rounded-full border-2 border-[rgba(139,124,246,.5)]" style={{ animation: "brf-ring 2.4s ease-out infinite 1.2s" }} />
              </>
            )}
            <div className={`flex h-[150px] w-[150px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#a99cff,#5B4BE8_60%,#3a24b8)] shadow-[0_20px_60px_-14px_rgba(91,75,232,.85)] ${done ? "" : "anim-pulse"}`}>
              <MicIcon size={46} className="text-white" />
            </div>
          </div>

          <div className="flex h-[34px] items-end gap-[5px]">
            {waveDelays.map((d, i) => (
              <div key={i} className="h-full w-[5px] origin-bottom rounded-full bg-[#8B7CF6]" style={done ? { transform: "scaleY(.35)" } : { animation: `brf-wave 1s ease-in-out infinite ${d}` }} />
            ))}
          </div>
          <div className="text-[13.5px] text-[#a9a7b6]">
            {aiReady === null
              ? "Connecting…"
              : aiReady
                ? "Type below — Maya replies in real time"
                : done
                  ? "Session complete — great work"
                  : "Listening… or pick a reply below"}
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <button className="flex h-[54px] w-[54px] items-center justify-center rounded-full border border-white/[.14] bg-white/[.08] transition hover:bg-white/[.16]">
            <MicOffIcon size={20} className="text-white" />
          </button>
          <button
            onClick={() => { if (!done) { setDone(true); setTip("Session ended. Start another anytime from AI Tutors."); } }}
            className="flex h-[66px] w-[66px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#FF6B4A,#E14E2A)] shadow-[0_12px_30px_-10px_rgba(225,78,42,.8)] transition hover:brightness-[1.08]"
          >
            <HangupIcon size={26} />
          </button>
          <button className="flex h-[54px] w-[54px] items-center justify-center rounded-full border border-white/[.14] bg-white/[.08] transition hover:bg-white/[.16]">
            <SettingsBurstIcon size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Transcript + coaching */}
      <div className="flex flex-col gap-4">
        <div className="flex min-h-0 flex-1 flex-col rounded-[22px] border border-[#E7E4DD] bg-white px-5 pb-4 pt-5">
          <div className="mb-3.5 flex items-center justify-between">
            <div className="font-display text-[16px] font-bold">Live transcript</div>
            <div className="flex items-center gap-1.5 text-[12px] text-[#8b887f]">
              <span className="h-1.5 w-1.5 rounded-full bg-green" />
              {aiReady ? "Powered by Claude" : "Auto-corrected"}
            </div>
          </div>
          <div ref={scrollRef} className="flex max-h-[280px] flex-col gap-3 overflow-y-auto pr-1">
            {transcript.map((m, i) => (
              <div key={i} className="flex flex-col gap-[5px]" style={{ alignItems: m.from === "user" ? "flex-end" : "flex-start" }}>
                <div
                  className="max-w-[88%] rounded-[15px] px-3.5 py-[11px] text-[13.5px] leading-[1.5]"
                  style={
                    m.from === "user"
                      ? m.ok === false
                        ? { background: "#FFF6F3", color: "#5c4238", border: "1px solid #FADDD2" }
                        : { background: "linear-gradient(135deg,#7C6CF6,#5B4BE8)", color: "#fff" }
                      : { background: "#F1EFEA", color: "#2b2926" }
                  }
                >
                  {m.text || <span className="opacity-50">…</span>}
                </div>
              </div>
            ))}
          </div>

          {/* AI mode: free-text input */}
          {aiReady && !done && (
            <div className="mt-4 flex items-center gap-2 border-t border-[#EFECE5] pt-4">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                disabled={busy}
                placeholder="Say something to Maya…"
                className="flex-1 rounded-[12px] border border-[#E4E1DA] bg-white px-3.5 py-2.5 text-[13.5px] outline-none focus:border-brand disabled:opacity-60"
              />
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                className="grad-brand rounded-[12px] px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send
              </button>
            </div>
          )}

          {/* Scripted mode: reply options */}
          {!aiReady && aiReady !== null && !done && (
            <div className="mt-4 flex flex-col gap-2 border-t border-[#EFECE5] pt-4">
              {current.options.map((o, i) => (
                <button
                  key={i}
                  onClick={() => choose(o)}
                  className="rounded-[13px] border border-[#E4E1DA] bg-white px-4 py-2.5 text-left text-[13.5px] font-semibold text-ink transition hover:border-brand hover:bg-cream-soft hover:text-brand-deep"
                >
                  {o.text}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[18px] border border-[#DCD6FA] bg-[linear-gradient(135deg,#EEEBFD,#F4F2FE)] px-[18px] py-[17px]">
          <div className="mb-2 flex items-center gap-2 text-[12.5px] font-extrabold tracking-[.04em] text-brand">
            <SparkleIcon size={15} />
            {aiReady ? "LIVE AI TUTOR" : "COACHING TIP"}
          </div>
          <div className="text-[13.5px] leading-[1.55] text-[#3d3a52]">{tip}</div>
        </div>
      </div>
    </div>
  );
}
