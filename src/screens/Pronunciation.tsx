import { useState } from "react";
import { PlayIcon, MicIcon } from "../components/icons";
import { actions } from "../lib/store";

interface Ph {
  s: string;
  acc: number; // 0..100
}

const BASE: Ph[] = [
  { s: "could", acc: 92 },
  { s: "I", acc: 96 },
  { s: "have", acc: 88 },
  { s: "a", acc: 90 },
  { s: "ta", acc: 62 },
  { s: "ble", acc: 34 },
  { s: "for", acc: 91 },
  { s: "two", acc: 94 },
  { s: "please", acc: 66 },
];

function colorFor(acc: number): string {
  if (acc >= 85) return "#1FA971";
  if (acc >= 60) return "#F5A524";
  return "#E14E2A";
}

function reroll(prev: Ph[]): Ph[] {
  // Simulate improvement: weak sounds drift up, strong ones stay high.
  return prev.map((p) => {
    const target = p.acc < 70 ? p.acc + 15 + Math.random() * 20 : 85 + Math.random() * 14;
    return { ...p, acc: Math.max(30, Math.min(99, Math.round(target))) };
  });
}

export default function Pronunciation() {
  const [phs, setPhs] = useState<Ph[]>(BASE);
  const [attempt, setAttempt] = useState(1);
  // First render matches the original design exactly (83); recomputed after re-record.
  const overall = attempt === 1 ? 83 : Math.round(phs.reduce((a, p) => a + p.acc, 0) / phs.length);
  const dash = 389.5;
  const offset = dash * (1 - overall / 100);
  const weakest = [...phs].sort((a, b) => a.acc - b.acc)[0];

  function recordAgain() {
    const next = reroll(phs);
    setPhs(next);
    setAttempt((a) => a + 1);
    actions.recordAnswer("speaking", true);
    actions.addXp(5);
    actions.registerActivity(1);
  }

  return (
    <div className="anim-fade mx-auto max-w-[900px]">
      <h1 className="m-0 mb-1 font-display text-[28px] font-extrabold tracking-[-.025em]">Pronunciation feedback</h1>
      <div className="mb-6 text-[14px] text-[#8b887f]">
        Léo analyzed your recording phoneme by phoneme{attempt > 1 ? ` · attempt ${attempt}` : ""}.
      </div>

      <div className="mb-[18px] grid grid-cols-[1fr_260px] gap-[18px]">
        <div className="rounded-[22px] border border-[#E7E4DD] bg-white p-[26px]">
          <div className="mb-3.5 text-[13px] font-semibold text-[#8b887f]">Target phrase</div>
          <div className="mb-[26px] font-display text-[26px] font-bold leading-[1.3] tracking-[-.02em]">
            {(() => {
              const acc = (s: string) => phs.find((p) => p.s === s)?.acc ?? 100;
              const ta = acc("ta"), ble = acc("ble"), please = acc("please");
              return (
                <>
                  <span className="text-green">Could I have a </span>
                  <span style={{ color: colorFor(ta) }}>ta</span>
                  <span style={{ color: colorFor(ble), borderBottom: ble < 45 ? `3px solid ${colorFor(ble)}` : undefined }}>ble</span>
                  <span className="text-green"> for two, </span>
                  <span style={{ color: colorFor(please) }}>please?</span>
                </>
              );
            })()}
          </div>
          <div className="mb-2 flex h-[70px] items-end gap-[3px] px-0.5">
            {phs.map((p) => (
              <div key={p.s} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="relative h-[44px] w-full overflow-hidden rounded-md bg-cream">
                  <div className="absolute bottom-0 w-full rounded-md transition-[height] duration-500" style={{ height: `${p.acc}%`, background: colorFor(p.acc) }} />
                </div>
                <span className="text-[11px] font-semibold text-[#8b887f]">{p.s}</span>
              </div>
            ))}
          </div>
          <div className="mt-3.5 flex gap-[18px] text-[12px] text-[#6b6862]">
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-green" />Accurate</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-gold" />Close</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-coral-deep" />Needs work</div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-[22px] bg-[linear-gradient(160deg,#211f2b,#141319)] p-6 text-white">
          <div className="relative mb-2 flex h-[150px] w-[150px] items-center justify-center">
            <svg width="150" height="150" viewBox="0 0 150 150">
              <circle cx="75" cy="75" r="62" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="13" />
              <circle cx="75" cy="75" r="62" fill="none" stroke="#3ee08b" strokeWidth="13" strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={offset.toFixed(1)} transform="rotate(-90 75 75)" style={{ transition: "stroke-dashoffset .5s ease" }} />
            </svg>
            <div className="absolute text-center">
              <div className="font-display text-[38px] font-extrabold tracking-[-.02em]">{overall}</div>
              <div className="text-[11px] font-semibold text-[#a9a7b6]">accuracy</div>
            </div>
          </div>
          <div className="text-center text-[13px] leading-[1.5] text-[#c9c7d4]">
            {overall >= 90 ? "Excellent — native-like!" : overall >= 75 ? "Better than 71% of learners at your level" : "Keep drilling the weak sounds"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div className="rounded-[18px] border border-[#FADDD2] bg-[#FFF6F3] p-5">
          <div className="mb-2.5 text-[12.5px] font-extrabold tracking-[.04em] text-coral-deep">FOCUS: THE "{attempt === 1 ? "BLE" : weakest.s.toUpperCase()}" SOUND</div>
          <div className="text-[13.5px] leading-[1.55] text-[#5c4238]">
            {attempt === 1 ? (
              <>
                You dropped the soft "l" in <b>ta-ble</b>. Place your tongue behind your top teeth and let the sound trail off. Tap below to hear Léo's model.
              </>
            ) : (
              <>
                Your weakest sound is <b>{weakest.s}</b> at {weakest.acc}%. Place your tongue behind your top teeth and let the sound trail off. Tap to hear Léo's model.
              </>
            )}
          </div>
          <button className="mt-3.5 flex items-center gap-2 rounded-[11px] bg-[linear-gradient(135deg,#FF6B4A,#E14E2A)] px-4 py-2.5 text-[13px] font-bold text-white transition hover:brightness-[1.05]">
            <PlayIcon size={15} />
            Hear model
          </button>
        </div>
        <div className="flex flex-col rounded-[18px] border border-[#E7E4DD] bg-white p-5">
          <div className="mb-2.5 text-[12.5px] font-extrabold tracking-[.04em] text-[#8b887f]">TRY AGAIN</div>
          <div className="flex-1 text-[13.5px] leading-[1.55] text-[#6b6862]">Record the phrase once more and Léo will re-score the sounds you missed. +5 XP each try.</div>
          <button onClick={recordAgain} className="grad-brand mt-3.5 flex items-center gap-2 self-start rounded-[11px] px-4 py-2.5 text-[13px] font-bold text-white transition hover:brightness-[1.05]">
            <MicIcon size={15} className="text-white" />
            Record again
          </button>
        </div>
      </div>
    </div>
  );
}
