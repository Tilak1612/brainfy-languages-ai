import { useEffect, useState } from "react";
import { PlayIcon, MicIcon } from "../components/icons";
import { actions } from "../lib/store";
import { checkVoice, speak, stopSpeaking, Recorder, transcribe } from "../lib/voice";

// This screen used to invent its results: a fixed array of phoneme scores was
// shown on mount (before any recording existed), "Record again" called
// Math.random() with weak sounds rigged to always improve, and the overall score
// was the literal constant 83. Worse, that fabricated feedback wrote real XP,
// real speaking mastery and real streak activity into Postgres — fake data
// contaminating the honest ledger.
//
// It now measures something true. We have working speech recognition, so we
// record the learner, transcribe it, and compare against the target word by
// word. "The recognizer did not hear this word" is a real, defensible signal.
// It is NOT phoneme-level scoring — that needs a dedicated vendor (Azure
// Pronunciation Assessment, Speechace) — and the copy says so rather than
// implying more precision than we have.

const PHRASE = "Could I have a table for two, please?";

/** Strip punctuation/case so "two," and "Two" compare equal. */
function normalize(w: string): string {
  return w.toLowerCase().replace(/[^a-z']/g, "");
}

interface WordResult {
  word: string;
  heard: boolean;
}

type Phase = "idle" | "recording" | "scoring" | "done" | "error";

export default function Pronunciation() {
  const [voiceReady, setVoiceReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [results, setResults] = useState<WordResult[] | null>(null);
  const [heardText, setHeardText] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [rec] = useState(() => new Recorder());
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkVoice().then(setVoiceReady);
    return stopSpeaking;
  }, []);

  const target = PHRASE.split(/\s+/);
  const score =
    results && results.length
      ? Math.round((results.filter((r) => r.heard).length / results.length) * 100)
      : null;
  const missed = results?.filter((r) => !r.heard).map((r) => r.word) ?? [];

  async function start() {
    setMessage("");
    try {
      await rec.start();
      setPhase("recording");
    } catch {
      setPhase("error");
      setMessage("Microphone access was denied. Allow it in your browser to practise speaking.");
    }
  }

  async function stop() {
    setPhase("scoring");
    try {
      const pcm = await rec.stop();
      const text = await transcribe(pcm);
      setHeardText(text);

      if (!text.trim()) {
        setPhase("error");
        setMessage("We couldn't hear anything. Check your microphone and try again.");
        return;
      }

      const heardWords = new Set(text.split(/\s+/).map(normalize).filter(Boolean));
      const next = target.map((w) => ({ word: w, heard: heardWords.has(normalize(w)) }));
      setResults(next);
      setAttempt((a) => a + 1);
      setPhase("done");

      // Only a genuine attempt earns credit, and only in proportion to what was
      // actually recognised — no more "always improved, always +5 XP".
      const correct = next.filter((r) => r.heard).length;
      const ratio = correct / next.length;
      actions.recordAnswer("speaking", ratio >= 0.7);
      actions.addXp(Math.round(ratio * 8));
      actions.registerActivity(1);
    } catch {
      setPhase("error");
      setMessage("Couldn't process the audio. Try again in a moment.");
    }
  }

  if (!voiceReady) {
    return (
      <div className="anim-fade mx-auto max-w-[620px] pt-10 text-center">
        <h1 className="m-0 font-display text-[26px] font-extrabold tracking-[-.025em]">
          Speaking practice
        </h1>
        <p className="mt-2 text-[14.5px] leading-[1.55] text-muted">
          Speech recognition isn't configured on this deployment, so we can't check your
          pronunciation yet. Everything else in the app still works.
        </p>
      </div>
    );
  }

  return (
    <div className="anim-fade mx-auto max-w-[720px]">
      <h1 className="m-0 mb-1 font-display text-[28px] font-extrabold tracking-[-.025em]">
        Speaking practice
      </h1>
      <p className="mb-6 text-[14px] text-muted">
        Say the phrase out loud. We'll show you which words the recogniser caught
        {attempt > 0 ? ` · attempt ${attempt}` : ""}.
      </p>

      <div className="rounded-[24px] border border-[#E7E4DD] bg-white px-8 py-9">
        <div className="mb-2 text-[12.5px] font-extrabold tracking-[.04em] text-muted">
          SAY THIS
        </div>

        {/* Per-word result. Before any attempt these are plain — no invented scores. */}
        <p className="m-0 mb-7 font-display text-[26px] font-bold leading-[1.35] tracking-[-.02em]">
          {target.map((w, i) => {
            const r = results?.[i];
            return (
              <span
                key={i}
                className={
                  r === undefined
                    ? ""
                    : r.heard
                      ? "text-green"
                      : "text-coral-deep underline decoration-wavy underline-offset-4"
                }
              >
                {w}
                {i < target.length - 1 ? " " : ""}
              </span>
            );
          })}
        </p>

        {score !== null && phase === "done" && (
          <div
            role="status"
            className="mb-7 rounded-[16px] border border-[#E7E4DD] bg-cream-soft px-5 py-4"
          >
            <div className="font-display text-[30px] font-extrabold tracking-[-.02em]">
              {score}%
              <span className="ml-2 align-middle text-[13px] font-semibold text-muted">
                of words recognised
              </span>
            </div>
            {missed.length > 0 ? (
              <p className="mt-1.5 text-[13.5px] leading-[1.55] text-[#5c4238]">
                The recogniser didn't catch{" "}
                <b>{missed.join(", ")}</b>. That usually means the word was rushed, dropped, or
                blended into the next one — try saying it on its own, then in the full phrase.
              </p>
            ) : (
              <p className="mt-1.5 text-[13.5px] text-[#3d3a52]">
                Every word came through clearly. Try saying it a little faster to build fluency.
              </p>
            )}
            {heardText && (
              <p className="mt-2 text-[12.5px] text-muted">
                We heard: “{heardText}”
              </p>
            )}
          </div>
        )}

        {(phase === "error" || message) && (
          <div
            role="alert"
            className="mb-6 rounded-[14px] border border-[#FADDD2] bg-[#FFF6F3] px-4 py-3 text-[13.5px] text-[#5c4238]"
          >
            {message}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={phase === "recording" ? stop : start}
            disabled={phase === "scoring"}
            aria-label={phase === "recording" ? "Stop recording and check" : "Record yourself saying the phrase"}
            className={`flex items-center gap-2 rounded-[12px] px-5 py-3 text-[14px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              phase === "recording"
                ? "bg-[linear-gradient(135deg,#FF6B4A,#E14E2A)]"
                : "grad-brand"
            }`}
          >
            <MicIcon size={16} className="text-white" />
            {phase === "recording"
              ? "Stop and check"
              : phase === "scoring"
                ? "Checking…"
                : attempt > 0
                  ? "Try again"
                  : "Start recording"}
          </button>

          <button
            onClick={() => void speak(PHRASE)}
            aria-label="Hear the phrase read aloud"
            className="flex items-center gap-2 rounded-[12px] border border-[#E4E1DA] bg-white px-5 py-3 text-[14px] font-bold text-[#4b4842] transition hover:bg-[#f3f1ec]"
          >
            <PlayIcon size={15} />
            Hear it
          </button>
        </div>

        <p className="mt-5 text-[12px] leading-[1.5] text-muted">
          This checks whether speech recognition caught each word — a useful proxy for clarity,
          but not a phoneme-level accent score.
        </p>
      </div>
    </div>
  );
}
