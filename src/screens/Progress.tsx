import type { ReactElement } from "react";
import { weekly } from "../data";
import { FlameIcon, MicIcon, CheckIcon, StarIcon, LockIcon } from "../components/icons";
import { useStore, type SkillKey } from "../lib/store";

const SKILL_META: { key: SkillKey; name: string; color: string }[] = [
  { key: "speaking", name: "Speaking", color: "#5B4BE8" },
  { key: "listening", name: "Listening", color: "#1FA971" },
  { key: "vocabulary", name: "Vocabulary", color: "#FF6B4A" },
  { key: "grammar", name: "Grammar", color: "#3B6FE0" },
  { key: "reading", name: "Reading", color: "#C6890A" },
];

interface Ach {
  id: string;
  label: string;
  bg: string;
  icon: ReactElement;
}
const ACHS: Ach[] = [
  { id: "streak21", label: "21-day streak", bg: "linear-gradient(135deg,#FFB27A,#FF6B4A)", icon: <FlameIcon size={30} color="#fff" /> },
  { id: "conv100", label: "100 conversations", bg: "linear-gradient(135deg,#8B7CF6,#5B4BE8)", icon: <MicIcon size={30} className="text-white" /> },
  { id: "words500", label: "500 words", bg: "linear-gradient(135deg,#34C3A0,#1FA971)", icon: <CheckIcon size={30} sw={2.2} className="text-white" /> },
  { id: "perfectweek", label: "Perfect week", bg: "linear-gradient(135deg,#FBD46A,#F5A524)", icon: <StarIcon size={30} color="#fff" /> },
  // Locked in the original design (never unlocked in the demo).
  { id: "c1level", label: "C1 level", bg: "#EDEAE3", icon: <LockIcon size={26} className="text-[#8b887f]" /> },
  { id: "days365", label: "365 days", bg: "#EDEAE3", icon: <LockIcon size={26} className="text-[#8b887f]" /> },
];

export default function Progress() {
  const streak = useStore((s) => s.streak);
  const xp = useStore((s) => s.xp);
  const words = useStore((s) => s.wordsLearned);
  const skills = useStore((s) => s.skills);
  const unlocked = useStore((s) => s.achievements);

  const stats = [
    { label: "Current streak", value: `${streak} days`, color: "#FF6B4A" },
    { label: "Total XP", value: xp.toLocaleString(), color: "#C6890A" },
    { label: "Words learned", value: words.toLocaleString(), color: "#1FA971" },
    { label: "CEFR level", value: "B2", color: "#5B4BE8" },
  ];

  return (
    <div className="anim-fade mx-auto max-w-[1180px]">
      <h1 className="m-0 mb-6 font-display text-[28px] font-extrabold tracking-[-.025em]">Your progress</h1>

      <div className="mb-[18px] grid grid-cols-4 gap-3.5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[18px] border border-[#E7E4DD] bg-white p-5">
            <div className="mb-2 text-[13px] font-semibold text-[#8b887f]">{s.label}</div>
            <div className="font-display text-[30px] font-extrabold tracking-[-.02em]" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-[18px] grid grid-cols-[1.3fr_1fr] gap-[18px]">
        <div className="rounded-[22px] border border-[#E7E4DD] bg-white p-6">
          <div className="mb-0.5 font-display text-[17px] font-bold">This week</div>
          <div className="mb-[22px] text-[13px] text-[#8b887f]">185 minutes · +12% vs last week</div>
          <div className="flex h-[170px] items-end justify-between gap-3">
            {weekly.map((w) => (
              <div key={w.d} className="flex h-full flex-1 flex-col items-center justify-end gap-[9px]">
                <div className="w-full max-w-[34px] rounded-t-[9px] rounded-b bg-[linear-gradient(180deg,#8B7CF6,#5B4BE8)]" style={{ height: w.h }} />
                <span className="text-[12px] font-semibold text-[#8b887f]">{w.d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[22px] border border-[#E7E4DD] bg-white p-6">
          <div className="mb-5 font-display text-[17px] font-bold">Skill mastery</div>
          <div className="flex flex-col gap-4">
            {SKILL_META.map((sk) => {
              const pct = Math.round(skills[sk.key] ?? 0);
              return (
                <div key={sk.key}>
                  <div className="mb-[7px] flex justify-between text-[13px] font-semibold">
                    <span>{sk.name}</span>
                    <span className="text-[#8b887f]">{pct}%</span>
                  </div>
                  <div className="h-[9px] overflow-hidden rounded-full bg-cream">
                    <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: sk.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-[22px] border border-[#E7E4DD] bg-white p-6">
        <div className="mb-5 flex items-baseline justify-between">
          <div className="font-display text-[17px] font-bold">Achievements</div>
          <span className="text-[13px] font-semibold text-[#8b887f]">
            {ACHS.filter((a) => unlocked.includes(a.id)).length} of {ACHS.length} unlocked
          </span>
        </div>
        <div className="grid grid-cols-6 gap-3.5">
          {ACHS.map((a) => {
            const has = unlocked.includes(a.id);
            return (
              <div key={a.id} className="text-center" style={{ opacity: has ? 1 : 0.4 }}>
                <div className="mb-[9px] flex aspect-square w-full items-center justify-center rounded-2xl" style={{ background: has ? a.bg : "#EDEAE3" }}>
                  {has ? a.icon : <LockIcon size={26} className="text-[#8b887f]" />}
                </div>
                <div className="text-[11.5px] font-bold" style={has ? undefined : { color: "#8b887f" }}>{a.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
