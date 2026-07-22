import { useState } from "react";
import type { Screen } from "../data";
import { MicIcon, BookIcon, WaveIcon, SparkleIcon } from "../components/icons";
import { actions } from "../lib/store";
import { useDisplayName } from "../lib/auth";

// First-run screen. A new account previously landed straight on a dashboard
// showing zeros everywhere with no explanation of what the app does or where to
// start — the single worst moment in the product. This orients them in one
// screen and hands them a first action.
//
// Shown once; the flag is stored per-user in the same place as the rest of the
// learner's state, so it survives a reload and does not reappear.
const DAILY_GOALS = [
  { min: 10, label: "Casual", sub: "10 min a day" },
  { min: 25, label: "Regular", sub: "25 min a day" },
  { min: 45, label: "Serious", sub: "45 min a day" },
];

export default function Welcome({ onDone }: { onDone: (s: Screen) => void }) {
  const learner = useDisplayName();
  const [goal, setGoal] = useState(25);

  function start(screen: Screen) {
    actions.setDailyGoal(goal);
    actions.completeOnboarding();
    onDone(screen);
  }

  return (
    <div className="anim-fade mx-auto max-w-[640px] pb-10">
      <div className="mb-2 flex items-center gap-2 text-[12.5px] font-extrabold tracking-[.04em] text-brand">
        <SparkleIcon size={15} />
        WELCOME
      </div>
      <h1 className="m-0 font-display text-[28px] font-extrabold leading-[1.15] tracking-[-.025em] md:text-[34px]">
        Hi {learner} — let's get you talking.
      </h1>
      <p className="mt-3 text-[15px] leading-[1.6] text-[#4b4842]">
        Brainfy is built around conversation. You'll practise with an AI tutor that listens,
        replies, and gently corrects you — then reinforce what you learned with short exercises
        and spaced review.
      </p>

      <h2 className="mb-3 mt-8 font-display text-[17px] font-bold">Pick a daily goal</h2>
      <div
        role="radiogroup"
        aria-label="Daily goal"
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
      >
        {DAILY_GOALS.map((g) => (
          <button
            key={g.min}
            role="radio"
            aria-checked={goal === g.min}
            onClick={() => setGoal(g.min)}
            className={`rounded-[16px] border-[1.5px] bg-white p-4 text-left transition ${
              goal === g.min
                ? "border-brand shadow-[0_0_0_1px_var(--color-brand)]"
                : "border-[#E4E1DA] hover:border-brand"
            }`}
          >
            <div className="text-[15px] font-bold">{g.label}</div>
            <div className="text-[13px] text-muted">{g.sub}</div>
          </button>
        ))}
      </div>
      <p className="mt-2 text-[12.5px] text-muted">You can change this later in your profile.</p>

      <h2 className="mb-3 mt-8 font-display text-[17px] font-bold">Where would you like to start?</h2>
      <div className="flex flex-col gap-2.5">
        <Choice
          icon={<MicIcon size={20} className="text-brand" />}
          title="Talk to a tutor"
          body="A real conversation with Maya. Speak or type — she adapts to you."
          onClick={() => start("voice")}
          primary
        />
        <Choice
          icon={<BookIcon size={20} />}
          title="Build a sentence"
          body="Short translation exercises with instant grammar explanations."
          onClick={() => start("lesson")}
        />
        <Choice
          icon={<WaveIcon size={20} />}
          title="Practise saying a phrase"
          body="Say it out loud and see which words came through clearly."
          onClick={() => start("pron")}
        />
      </div>

      <button
        onClick={() => start("dashboard")}
        className="mt-6 w-full text-[13.5px] text-muted transition hover:text-ink"
      >
        Skip — take me to the dashboard
      </button>
    </div>
  );
}

function Choice({
  icon,
  title,
  body,
  onClick,
  primary,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3.5 rounded-[16px] border-[1.5px] bg-white p-4 text-left transition hover:border-brand ${
        primary ? "border-brand" : "border-[#E4E1DA]"
      }`}
    >
      <span className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-brand-tint">
        {icon}
      </span>
      <span>
        <span className="block text-[15px] font-bold">{title}</span>
        <span className="block text-[13.5px] leading-[1.5] text-muted">{body}</span>
      </span>
    </button>
  );
}
