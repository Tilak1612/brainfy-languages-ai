import { useEffect, useMemo, useState } from "react";
import type { Screen } from "../data";
import { BackIcon, SkipIcon, CubeIcon, SparkleIcon } from "../components/icons";
import { type BuilderItem } from "../content/learning";
import { useContent } from "../lib/content";
import { actions } from "../lib/store";
import { checkAi, streamChat, GRAMMAR_COACH } from "../lib/chat";
import { checkVoice, speak, stopSpeaking } from "../lib/voice";

type Feedback = null | "correct" | "wrong";

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export default function Lesson({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [done, setDone] = useState(false);
  const [earned, setEarned] = useState(0);

  const [aiReady, setAiReady] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState("");

  useEffect(() => {
    checkAi().then(setAiReady);
    checkVoice().then(setVoiceReady);
    return stopSpeaking;
  }, []);

  const { lessons } = useContent();
  const item: BuilderItem = lessons[idx] ?? lessons[0];
  const bank = useMemo(() => shuffle(item.bank), [item.id]);
  const tokens = picked.map((p) => p.split("#")[0]);
  const target = item.answer.join(" ");

  /** Read the target sentence aloud in Maya's voice. */
  function hearIt() {
    void speak(target);
  }

  /** Ask the grammar coach why the sentence is built the way it is. */
  async function explainGrammar() {
    if (explaining) return;
    setExplaining(true);
    setExplanation("");
    try {
      await streamChat(GRAMMAR_COACH, [{ role: "user", content: target }], (delta) =>
        setExplanation((e) => e + delta),
      );
    } catch {
      setExplanation("Couldn't reach the grammar coach just now — try again in a moment.");
    } finally {
      setExplaining(false);
    }
  }

  function pick(word: string, i: number) {
    if (feedback) return;
    setPicked([...picked, word + "#" + i]);
  }
  function unpick(tok: string) {
    if (feedback) return;
    setPicked(picked.filter((p) => p !== tok));
  }

  function check() {
    const correct = JSON.stringify(tokens) === JSON.stringify(item.answer);
    setFeedback(correct ? "correct" : "wrong");
    actions.recordAnswer(item.skill, correct);
    if (correct) {
      const xp = 10;
      actions.addXp(xp);
      setEarned((e) => e + xp);
    }
  }

  function next() {
    setFeedback(null);
    setPicked([]);
    setExplanation("");
    stopSpeaking();
    if (idx + 1 >= lessons.length) {
      actions.completeLesson();
      actions.registerActivity(4);
      setDone(true);
    } else {
      setIdx(idx + 1);
    }
  }

  if (done) {
    return (
      <div className="anim-fade mx-auto max-w-[560px] text-center">
        <div className="mb-6 mt-10 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#34C3A0,#1FA971)] text-white">
          <SparkleIcon size={36} color="#fff" />
        </div>
        <h1 className="m-0 font-display text-[30px] font-extrabold tracking-[-.025em]">Lesson complete!</h1>
        <p className="mt-2 text-[15px] text-[#6b6862]">
          Nice work. You earned <b className="text-brand">+{earned} XP</b> and kept your streak alive.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => onNavigate("review")}
            className="rounded-[13px] border border-[#E4E1DA] bg-white px-6 py-3 text-[14px] font-bold text-[#4b4842] transition hover:bg-[#f3f1ec]"
          >
            Review vocabulary
          </button>
          <button
            onClick={() => onNavigate("dashboard")}
            className="grad-brand rounded-[13px] px-6 py-3 text-[14px] font-bold text-white transition hover:brightness-[1.07]"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="anim-fade mx-auto max-w-[820px]">
      <div className="mb-6 flex items-center gap-3.5">
        <button
          onClick={() => onNavigate("dashboard")}
          aria-label="Back to dashboard"
          className="flex h-11 w-11 items-center justify-center rounded-[11px] md:h-10 md:w-10 border border-[#E4E1DA] bg-white text-[#4b4842] transition hover:bg-[#e9e6df]"
        >
          <BackIcon size={18} />
        </button>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#E4E1DA]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#8B7CF6,#5B4BE8)] transition-[width] duration-300"
            style={{ width: `${(idx / lessons.length) * 100}%` }}
          />
        </div>
        <div className="text-[13.5px] font-bold text-muted">
          {idx + 1} / {lessons.length}
        </div>
      </div>

      <div className="rounded-[24px] border border-[#E7E4DD] bg-white px-5 py-7 shadow-[0_1px_2px_rgba(20,20,30,.04)] md:px-9 md:py-[38px]">
        <h1 className="mb-[22px] inline-flex items-center gap-[7px] rounded-full bg-brand-tint px-3 py-1.5 text-[12px] font-extrabold tracking-[.03em] text-brand">
          SENTENCE BUILDER
        </h1>
        <div className="mb-2 text-[14px] font-semibold text-muted">{item.hint}</div>
        <h2 className="m-0 mb-6 font-display text-[22px] font-bold tracking-[-.02em] md:mb-[30px] md:text-[28px]">{item.prompt}</h2>

        {/* Answer slots */}
        <div
          className={[
            "mb-6 flex min-h-[64px] flex-wrap items-center gap-[9px] border-b-2 border-dashed pb-4 transition-colors",
            feedback === "correct" ? "border-green" : feedback === "wrong" ? "border-coral-deep" : "border-[#D8D4CC]",
          ].join(" ")}
        >
          {picked.map((p) => (
            <button
              key={p}
              onClick={() => unpick(p)}
              className="rounded-xl bg-brand-tint px-4 py-[11px] text-[15.5px] font-bold text-brand-deep transition hover:opacity-70"
            >
              {p.split("#")[0]}
            </button>
          ))}
          {picked.length === 0 && <span className="text-[14px] text-[#b8b4ab]">Tap words to build the sentence…</span>}
        </div>

        {/* Word bank */}
        <div className="mb-[30px] flex flex-wrap gap-[11px]">
          {bank.map((w, i) =>
            picked.includes(w + "#" + i) ? (
              <span key={w + i} className="rounded-xl border-[1.5px] border-transparent bg-[#f3f1ec] px-[17px] py-[11px] text-[15.5px] font-bold text-[#c9c5bc]">
                {w}
              </span>
            ) : (
              <button
                key={w + i}
                onClick={() => pick(w, i)}
                className="rounded-xl border-[1.5px] border-[#E4E1DA] bg-white px-[17px] py-[11px] text-[15.5px] font-bold text-ink transition hover:border-brand hover:text-brand-deep"
              >
                {w}
              </button>
            ),
          )}
        </div>

        {/* Feedback banner */}
        {feedback === "correct" && (
          <div role="alert" className="mb-5 rounded-[14px] border border-[#B8E6D2] bg-[#E3F6EE] px-4 py-3 text-[14px] font-semibold text-green">
            ¡Correcto! +10 XP
          </div>
        )}
        {feedback === "wrong" && (
          <div role="alert" className="mb-5 rounded-[14px] border border-[#FADDD2] bg-[#FFF6F3] px-4 py-3 text-[14px] text-[#5c4238]">
            Not quite. Correct answer: <b>{item.answer.join(" ")}</b>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <button
            onClick={next}
            className="flex items-center gap-[7px] text-[14px] font-bold text-muted transition hover:text-ink"
          >
            <SkipIcon size={17} />
            Skip
          </button>
          {feedback ? (
            <button
              onClick={next}
              className="grad-brand rounded-[13px] px-[30px] py-[13px] text-[15px] font-bold text-white shadow-[0_10px_26px_-10px_rgba(91,75,232,.7)] transition hover:brightness-[1.07]"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={check}
              disabled={picked.length === 0}
              className="grad-brand rounded-[13px] px-[30px] py-[13px] text-[15px] font-bold text-white shadow-[0_10px_26px_-10px_rgba(91,75,232,.7)] transition hover:brightness-[1.07] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Check
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={hearIt}
          disabled={!voiceReady}
          title={voiceReady ? "Hear the sentence read aloud" : "Voice isn't configured on this server"}
          className="flex flex-1 items-center justify-center gap-2 rounded-[13px] border border-[#E4E1DA] bg-white py-[13px] text-[13.5px] font-bold text-[#4b4842] transition hover:bg-[#f3f1ec] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CubeIcon size={17} className="text-muted" />
          Hear it
        </button>
        <button
          onClick={explainGrammar}
          disabled={!aiReady || explaining}
          title={aiReady ? "Ask the grammar coach about this sentence" : "AI isn't configured on this server"}
          className="flex flex-1 items-center justify-center gap-2 rounded-[13px] border border-[#E4E1DA] bg-white py-[13px] text-[13.5px] font-bold text-[#4b4842] transition hover:bg-[#f3f1ec] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SparkleIcon size={17} color="#6b6862" filled={false} />
          {explaining ? "Explaining…" : "Explain grammar"}
        </button>
      </div>

      {(explaining || explanation) && (
        <div className="anim-fade mt-3 rounded-[16px] border border-[#DCD6FA] bg-[linear-gradient(135deg,#EEEBFD,#F4F2FE)] px-[18px] py-[17px]">
          <div className="mb-2 flex items-center gap-2 text-[12.5px] font-extrabold tracking-[.04em] text-brand">
            <SparkleIcon size={15} />
            GRAMMAR COACH
          </div>
          <div className="text-[13.5px] leading-[1.55] text-[#3d3a52]">
            {explanation || <span className="opacity-50">Thinking…</span>}
          </div>
        </div>
      )}
    </div>
  );
}
