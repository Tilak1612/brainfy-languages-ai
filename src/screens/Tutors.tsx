import { useState } from "react";
import type { Screen } from "../data";
import { PlusIcon } from "../components/icons";
import { allPersonas, buildCustom, addCustom, removeCustom, setActive, useTutors, type Persona } from "../lib/tutors";

const FOCUS = ["Conversation", "Grammar", "Pronunciation", "Business & interview", "Travel"];
const PERSONALITY = ["Warm and patient", "Precise and structured", "Playful and energetic", "Calm and formal"];
const ACCENT = ["Neutral", "British", "American", "Australian"];

export default function Tutors({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  // Subscribing here is what re-renders the grid when a custom tutor is
  // added or the active tutor changes.
  const { active } = useTutors();
  const [building, setBuilding] = useState(false);
  const [name, setName] = useState("");
  const [focus, setFocus] = useState(FOCUS[0]);
  const [personality, setPersonality] = useState(PERSONALITY[0]);
  const [accent, setAccent] = useState(ACCENT[0]);

  const personas = allPersonas();

  function start(p: Persona) {
    setActive(p.id);
    onNavigate("voice");
  }

  function create() {
    const p = buildCustom({ name, focus, personality, accent });
    addCustom(p); // also makes it active
    setBuilding(false);
    setName("");
    onNavigate("voice");
  }

  return (
    <div className="anim-fade mx-auto max-w-[1180px]">
      <h1 className="m-0 mb-1 font-display text-[28px] font-extrabold tracking-[-.025em]">
        Choose your AI tutor
      </h1>
      <div className="mb-6 text-[14px] text-muted">
        Each tutor has a distinct personality, teaching style and voice. Persistent memory means they
        remember every session.
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-4">
        {personas.map((t) => (
          <div
            key={t.id}
            className={`flex flex-col rounded-[22px] border bg-white p-6 transition ${
              t.id === active ? "border-brand shadow-[0_0_0_1px_var(--color-brand)]" : "border-[#E7E4DD]"
            }`}
          >
            <div className="mb-4 flex items-center gap-3.5">
              <div
                className="flex h-[58px] w-[58px] items-center justify-center rounded-[17px] font-display text-[22px] font-extrabold text-white"
                style={{ background: t.grad }}
              >
                {t.initials}
              </div>
              <div className="min-w-0 leading-[1.25]">
                <div className="flex items-center gap-2">
                  <div className="truncate font-display text-[18px] font-bold">{t.name}</div>
                  {t.id === active && (
                    <span className="flex-none rounded-md bg-brand-tint px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[.04em] text-brand">
                      Active
                    </span>
                  )}
                </div>
                <div className="truncate text-[13px] font-bold text-brand">{t.role}</div>
              </div>
            </div>
            <div className="mb-[18px] flex-1 text-[13.5px] leading-[1.55] text-[#6b6862]">
              {t.blurb}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => start(t)}
                className="grad-brand flex-1 rounded-xl py-[11px] text-[14px] font-bold text-white transition hover:brightness-[1.06]"
              >
                Start session
              </button>
              {t.custom && (
                <button
                  onClick={() => removeCustom(t.id)}
                  title={`Delete ${t.name}`}
                  className="rounded-xl border border-[#E4E1DA] px-3 text-[13px] font-bold text-muted transition hover:border-coral hover:text-coral-deep"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Custom tutor */}
        {building ? (
          <div className="flex min-h-[220px] flex-col rounded-[22px] border-[1.5px] border-brand bg-white p-5">
            <div className="mb-3 font-display text-[16px] font-bold">Build a custom tutor</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tutor name"
              aria-label="Tutor name"
              className="mb-2 rounded-[10px] border border-[#E4E1DA] px-3 py-2 text-[13px] outline-none focus:border-brand"
            />
            <Select label="Focus area" value={focus} onChange={setFocus} options={FOCUS} />
            <Select label="Personality" value={personality} onChange={setPersonality} options={PERSONALITY} />
            <Select label="Accent" value={accent} onChange={setAccent} options={ACCENT} />
            <div className="mt-auto flex gap-2 pt-3">
              <button
                onClick={create}
                disabled={!name.trim()}
                className="grad-brand flex-1 rounded-xl py-[10px] text-[13.5px] font-bold text-white transition hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Create & start
              </button>
              <button
                onClick={() => setBuilding(false)}
                className="rounded-xl border border-[#E4E1DA] px-3 text-[13px] font-bold text-muted transition hover:bg-[#f3f1ec]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setBuilding(true)}
            className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[22px] border-[1.5px] border-dashed border-[#CFCBFA] p-6 text-center transition-colors hover:border-brand hover:bg-cream-soft"
          >
            <div className="mb-4 flex h-[58px] w-[58px] items-center justify-center rounded-[17px] bg-brand-tint">
              <PlusIcon size={26} className="text-brand" />
            </div>
            <div className="mb-[5px] font-display text-[17px] font-bold">Build a custom tutor</div>
            <div className="text-[13px] leading-[1.5] text-muted">
              Pick a personality, voice, accent and focus area.
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      className="mb-2 rounded-[10px] border border-[#E4E1DA] bg-white px-3 py-2 text-[13px] outline-none focus:border-brand"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {label}: {o}
        </option>
      ))}
    </select>
  );
}
