import { useEffect, useRef, useState } from "react";
import { MicIcon, MicOffIcon, HangupIcon, SettingsBurstIcon, SparkleIcon } from "../components/icons";
import { cafeScript } from "../content/learning";
import { actions } from "../lib/store";
import { checkAi, streamChat, type ChatMsg } from "../lib/chat";
import { checkVoice, Recorder, transcribe, speak, stopSpeaking } from "../lib/voice";
import { useActiveTutor } from "../lib/tutors";
import { useDisplayName } from "../lib/auth";

interface Msg {
  from: "maya" | "user";
  text: string;
  ok?: boolean;
}

const waveDelays = ["0s", ".15s", ".3s", ".45s", ".6s", ".75s", ".9s"];
const DEFAULT_TIP =
  'Use polite frames like "Could I…, please?" — your tutor remembers what you practice.';

export default function Voice() {
  const tutor = useActiveTutor();
  const learner = useDisplayName();
  const GREETING = `Hi ${learner}! ${tutor.name} here. What did you get up to today?`;
  // A persona REFERENCE. The prompt itself lives server-side — the client can
  // no longer supply one, which is what made this endpoint a free Claude proxy.
  const persona = tutor.custom
    ? { tutorId: "custom" as const, custom: tutor.customFields, learner }
    : { tutorId: tutor.id, learner };
  const [aiReady, setAiReady] = useState<boolean | null>(null);
  const [voiceReady, setVoiceReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [muted, setMuted] = useState(false);
  // send() awaits the stream for seconds before speaking, so it must read the
  // mute state at reply time — not the value captured when it was called.
  const mutedRef = useRef(false);
  // Free conversation with Claude, or the guided café role-play. Defaults to
  // "ai" once we know a key is configured; scripted is the offline fallback.
  const [scripted, setScripted] = useState(false);
  const recRef = useRef<Recorder | null>(null);

  useEffect(() => {
    checkAi().then(setAiReady);
    checkVoice().then(setVoiceReady);
  }, []);

  // Never leave the tutor talking after the user navigates away.
  useEffect(() => stopSpeaking, []);

  // Real call clock — the design shows "Live · 02:14"; make it mean something.
  const [elapsed, setElapsed] = useState(0);

  // ---- shared UI: call panel chrome ----
  const [done, setDone] = useState(false);
  const [tip, setTip] = useState(DEFAULT_TIP);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [done]);

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
    const line =
      n >= cafeScript.length
        ? "¡Perfecto! You ordered like a local. See you next session."
        : cafeScript[n].maya;
    setMsgs([...next, { from: "maya", text: line }]);
    if (voiceReady && !muted) void speak(line);
    if (n >= cafeScript.length) {
      setTip("Great session — your café vocabulary is getting stronger.");
      actions.registerActivity(5);
      setDone(true);
    } else {
      setTip("Nice — natural and polite. Keep it up.");
      setStep(n);
    }
  }

  // ---- AI send (optionally driven by voice) ----
  async function send(override?: string) {
    const text = (override ?? input).trim();
    if (!text || busy) return;
    if (override === undefined) setInput("");
    setBusy(true);
    setAiMsgs((m) => [...m, { from: "user", text }, { from: "maya", text: "" }]);
    apiMsgs.current.push({ role: "user", content: text });
    actions.recordAnswer("speaking", true);
    try {
      const reply = await streamChat(persona, apiMsgs.current, (delta) => {
        setAiMsgs((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { from: "maya", text: copy[copy.length - 1].text + delta };
          return copy;
        });
      });
      apiMsgs.current.push({ role: "assistant", content: reply });
      actions.addXp(6);
      actions.registerActivity(1);
      setTip(`${tutor.name} is a live AI tutor — speak freely and they'll adapt to you.`);
      if (voiceReady && !mutedRef.current && reply) void speak(reply);
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

  // ---- microphone (voice input) ----
  async function toggleMic() {
    if (busy) return;
    if (recording) {
      setRecording(false);
      try {
        const pcm = await recRef.current!.stop();
        const text = await transcribe(pcm);
        if (text) await send(text);
        else setTip("Didn't catch that — try again or type.");
      } catch {
        setTip("Couldn't process the audio — try again or type.");
      }
    } else {
      try {
        recRef.current = new Recorder();
        await recRef.current.start();
        setRecording(true);
        setTip("Listening… tap the mic again when you're done speaking.");
      } catch {
        setTip("Microphone access was denied — you can type instead.");
      }
    }
  }

  // ---- call controls ----
  function toggleMute() {
    const next = !muted;
    if (next) stopSpeaking();
    mutedRef.current = next;
    setMuted(next);
    setTip(next ? `${tutor.name} is muted — you'll still see the replies.` : `${tutor.name}'s voice is back on.`);
  }

  /** End the call, or start a fresh one after hanging up. */
  function toggleCall() {
    stopSpeaking();
    if (done) return restart();
    setDone(true);
    setRecording(false);
    setTip("Session ended. Press the green button to start a new one.");
  }

  function restart(tipText = DEFAULT_TIP) {
    setDone(false);
    setElapsed(0);
    setStep(0);
    setMsgs([{ from: "maya", text: cafeScript[0].maya }]);
    setAiMsgs([{ from: "maya", text: GREETING }]);
    apiMsgs.current = [];
    setInput("");
    setTip(tipText);
  }

  /** Swap between free AI conversation and the guided café role-play. */
  function toggleScenario() {
    stopSpeaking();
    const next = !scripted;
    setScripted(next);
    // restart() owns the tip, so hand it the scenario message rather than
    // setting it here and having it clobbered in the same batch.
    restart(
      next
        ? "Café role-play — pick the most natural reply at each step."
        : `Free conversation — say anything and ${tutor.name} adapts to you.`,
    );
  }

  const aiMode = !!aiReady && !scripted;
  const canTalk = aiMode && voiceReady && !done && !busy;
  const transcript = aiMode ? aiMsgs : msgs;
  const clock = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const liveLabel = done
    ? "Session ended"
    : aiMode && busy
      ? "Live · thinking…"
      : `Live · ${clock}`;

  return (
    <div className="anim-fade mx-auto grid max-w-[1180px] grid-cols-1 gap-4 lg:grid-cols-[1.15fr_.85fr] lg:gap-5">
      {/* Live call panel */}
      <div className="relative flex min-h-[420px] flex-col items-center overflow-hidden rounded-[24px] bg-[linear-gradient(160deg,#211f2b,#141319)] p-5 text-white md:min-h-[560px] md:p-[30px]">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-[11px]">
            <div
              className="flex h-[42px] w-[42px] items-center justify-center rounded-[13px] font-display text-[17px] font-extrabold"
              style={{ background: tutor.grad }}
            >
              {tutor.initials}
            </div>
            <div className="leading-[1.2]">
              <div className="text-[15px] font-bold">{tutor.name}</div>
              <div className="flex items-center gap-[5px] text-[12px] text-mint">
                <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                {liveLabel}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-[7px] rounded-full border border-white/[.12] bg-white/[.08] px-3 py-1.5 text-[12px] font-semibold text-[#c9c7d4]">
            {aiMode ? tutor.badge : "Café role-play · A2"}
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
            <button
              onClick={canTalk ? toggleMic : undefined}
              disabled={!canTalk}
              title={
                canTalk
                  ? recording
                    ? "Stop and send"
                    : `Tap to speak to ${tutor.name}`
                  : done
                    ? "Session ended — press the green button to start a new one"
                    : !aiMode
                      ? "Pick a reply below, or switch to free conversation"
                      : "Voice input isn't available right now — type instead"
              }
              className={`flex h-[150px] w-[150px] items-center justify-center rounded-full shadow-[0_20px_60px_-14px_rgba(91,75,232,.85)] transition ${
                recording
                  ? "bg-[radial-gradient(circle_at_35%_30%,#ff9d84,#E14E2A_60%,#a32d12)] animate-pulse"
                  : "bg-[radial-gradient(circle_at_35%_30%,#a99cff,#5B4BE8_60%,#3a24b8)]"
              } ${canTalk ? "cursor-pointer hover:brightness-[1.08]" : "cursor-default"} ${done || recording ? "" : "anim-pulse"}`}
            >
              <MicIcon size={46} className="text-white" />
            </button>
          </div>

          <div className="flex h-[34px] items-end gap-[5px]">
            {waveDelays.map((d, i) => (
              <div key={i} className="h-full w-[5px] origin-bottom rounded-full bg-[#8B7CF6]" style={done ? { transform: "scaleY(.35)" } : { animation: `brf-wave 1s ease-in-out infinite ${d}` }} />
            ))}
          </div>
          <div className="text-[13.5px] text-[#a9a7b6]">
            {aiReady === null
              ? "Connecting…"
              : done
                ? "Session complete — great work"
                : recording
                  ? "Listening… tap the mic when you're done"
                  : aiMode
                    ? canTalk
                      ? "Tap the mic to speak, or type below"
                      : `Type below — ${tutor.name} replies in real time`
                    : "Listening… or pick a reply below"}
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <button
            onClick={toggleMute}
            title={muted ? `Unmute ${tutor.name}'s voice` : `Mute ${tutor.name}'s voice`}
            aria-pressed={muted}
            className={`flex h-[54px] w-[54px] items-center justify-center rounded-full border transition ${
              muted
                ? "border-coral/60 bg-coral/25 text-coral"
                : "border-white/[.14] bg-white/[.08] text-white hover:bg-white/[.16]"
            }`}
          >
            <MicOffIcon size={20} />
          </button>
          <button
            onClick={toggleCall}
            title={done ? "Start a new session" : "End session"}
            className={`flex h-[66px] w-[66px] items-center justify-center rounded-full text-white transition hover:brightness-[1.08] ${
              done
                ? "bg-[linear-gradient(135deg,#4ADE80,#16A34A)] shadow-[0_12px_30px_-10px_rgba(22,163,74,.8)]"
                : "bg-[linear-gradient(135deg,#FF6B4A,#E14E2A)] shadow-[0_12px_30px_-10px_rgba(225,78,42,.8)]"
            }`}
          >
            {done ? <MicIcon size={26} /> : <HangupIcon size={26} />}
          </button>
          <button
            onClick={toggleScenario}
            disabled={!aiReady}
            title={aiMode ? "Switch to café role-play" : "Switch to free conversation"}
            className="flex h-[54px] w-[54px] items-center justify-center rounded-full border border-white/[.14] bg-white/[.08] text-white transition hover:bg-white/[.16] disabled:opacity-40"
          >
            <SettingsBurstIcon size={20} />
          </button>
        </div>
      </div>

      {/* Transcript + coaching */}
      <div className="flex flex-col gap-4">
        <div className="flex min-h-0 flex-1 flex-col rounded-[22px] border border-[#E7E4DD] bg-white px-5 pb-4 pt-5">
          <div className="mb-3.5 flex items-center justify-between">
            <div className="font-display text-[16px] font-bold">Live transcript</div>
            <div className="flex items-center gap-1.5 text-[12px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-green" />
              {aiMode ? "Powered by Claude" : "Auto-corrected"}
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
          {aiMode && !done && (
            <div className="mt-4 flex items-center gap-2 border-t border-[#EFECE5] pt-4">
              {voiceReady && (
                <button
                  onClick={toggleMic}
                  disabled={busy}
                  title={recording ? "Stop and send" : `Speak to ${tutor.name}`}
                  className={`flex h-[40px] w-[40px] flex-none items-center justify-center rounded-[12px] border transition disabled:opacity-40 ${
                    recording
                      ? "border-coral-deep bg-[#FFEDE7] text-coral-deep animate-pulse"
                      : "border-[#E4E1DA] bg-white text-brand hover:border-brand"
                  }`}
                >
                  <MicIcon size={18} />
                </button>
              )}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                disabled={busy || recording}
                placeholder={recording ? "Listening…" : `Say something to ${tutor.name}…`}
                className="flex-1 rounded-[12px] border border-[#E4E1DA] bg-white px-3.5 py-2.5 text-[13.5px] outline-none focus:border-brand disabled:opacity-60"
              />
              <button
                onClick={() => send()}
                disabled={busy || !input.trim()}
                className="grad-brand rounded-[12px] px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send
              </button>
            </div>
          )}

          {/* Scripted mode: reply options */}
          {!aiMode && aiReady !== null && !done && (
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
            {aiMode ? "LIVE AI TUTOR" : "COACHING TIP"}
          </div>
          <div className="text-[13.5px] leading-[1.55] text-[#3d3a52]">{tip}</div>
        </div>
      </div>
    </div>
  );
}
