import { useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon, FlameIcon, StarIcon, BellIcon, SettingsBurstIcon } from "./icons";
import { useStore, dueCount } from "../lib/store";
import { buildIndex, search } from "../lib/search";
import { useContent } from "../lib/content";
import type { Screen } from "../data";

export default function Topbar({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const streak = useStore((s) => s.streak);
  const xp = useStore((s) => s.xp);
  const cards = useStore((s) => s.cards);
  const goalMin = useStore((s) => s.dailyGoalMin);
  const doneMin = useStore((s) => s.minutesToday);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // Index the LIVE content, not the bundled arrays — otherwise only the
  // original 5 lessons and 12 words are findable.
  const { vocab, lessons } = useContent();
  const index = useMemo(() => buildIndex(lessons, vocab), [lessons, vocab]);
  const hits = useMemo(() => search(index, q), [index, q]);
  const due = useMemo(() => dueCount(vocab.map((v) => v.id)), [cards, vocab]);

  // Live, honest notifications — every line is derived from real state.
  const notes = useMemo(() => {
    const out: string[] = [];
    if (due > 0) out.push(`${due} word${due === 1 ? "" : "s"} due for review.`);
    const left = Math.max(0, goalMin - doneMin);
    out.push(left > 0 ? `${left} min left of your ${goalMin} min daily goal.` : `Daily goal complete — ${doneMin} min today.`);
    if (streak > 0) out.push(`You're on a ${streak}-day streak. Keep it alive.`);
    return out;
  }, [due, goalMin, doneMin, streak]);

  // Close either popover on an outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!searchRef.current?.contains(t)) setOpen(false);
      if (!bellRef.current?.contains(t)) setBellOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function go(i: number) {
    const hit = hits[i];
    if (!hit) return;
    onNavigate(hit.screen);
    setQ("");
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") return setOpen(false);
    if (!hits.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + hits.length) % hits.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(active);
    }
  }

  return (
    <header className="relative z-[5] flex h-[60px] flex-none items-center gap-2 border-b border-[#E4E1DA] bg-cream/[.82] px-4 backdrop-blur-[10px] md:h-[66px] md:gap-4 md:px-7">
      <div ref={searchRef} className="relative mr-auto min-w-[150px] max-w-[420px] flex-1">
        <div className="flex items-center gap-2.5 rounded-[11px] border border-[#E4E1DA] bg-white px-[13px] py-[9px] text-muted focus-within:border-brand">
          <SearchIcon size={16} className="flex-none" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            aria-label="Search lessons, tutors and words"
            placeholder="Search lessons, tutors, words…"
            className="w-full bg-transparent text-[13.5px] text-ink outline-none placeholder:text-muted"
          />
        </div>

        {open && q.trim() !== "" && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] overflow-hidden rounded-[13px] border border-[#E4E1DA] bg-white py-1.5 shadow-[0_18px_44px_-16px_rgba(25,24,23,.35)]">
            {hits.length === 0 ? (
              <div className="px-3.5 py-2.5 text-[13px] text-muted">No matches for “{q}”.</div>
            ) : (
              hits.map((h, i) => (
                <button
                  key={h.kind + h.label + i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(i)}
                  className={`flex w-full items-center gap-3 px-3.5 py-2 text-left transition ${
                    i === active ? "bg-cream-soft" : "bg-white"
                  }`}
                >
                  <span className="flex-none rounded-md bg-brand-tint px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[.04em] text-brand">
                    {h.kind}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-ink">{h.label}</span>
                    <span className="block truncate text-[12px] text-muted">{h.detail}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Course indicator, deliberately NOT a control. It previously read just
          "EN", which was ambiguous about direction and looked like a switcher.
          Only one course exists; a dropdown would promise languages we do not
          have. Styled flat so it does not invite a click. */}
      <div className="hidden items-center gap-1.5 rounded-full bg-brand-tint px-3 py-1.5 sm:flex">
        <span className="text-[12.5px] font-bold text-brand">ES → EN</span>
        <span className="sr-only">
          Your course: learning English from Spanish. Only this course is available right now.
        </span>
      </div>

      <div className="flex items-center gap-1.5 rounded-full bg-[#FFEDE7] px-[13px] py-[7px] text-[13.5px] font-extrabold text-coral-deep">
        <FlameIcon size={15} />
        {streak}
      </div>

      <div className="flex items-center gap-1.5 rounded-full border border-[#E4E1DA] bg-white px-[13px] py-[7px] text-[13.5px] font-extrabold text-ink">
        <StarIcon size={15} />
        {xp.toLocaleString()}
      </div>

      {/* Settings — the only account entry point on mobile, where the sidebar
          (and its user menu) is hidden. */}
      <button
        onClick={() => onNavigate("settings")}
        aria-label="Settings"
        className="flex h-11 w-11 items-center justify-center rounded-[11px] border border-[#E4E1DA] bg-white text-[#4b4842] transition hover:bg-[#f3f1ec] md:h-10 md:w-10"
      >
        <SettingsBurstIcon size={18} />
      </button>

      <div ref={bellRef} className="relative">
        <button
          onClick={() => setBellOpen((b) => !b)}
          aria-label={due > 0 ? `Notifications, ${due} words due` : "Notifications"}
          aria-expanded={bellOpen}
          className="relative flex h-11 w-11 items-center justify-center rounded-[11px] md:h-10 md:w-10 border border-[#E4E1DA] bg-white text-[#4b4842] transition hover:bg-[#f3f1ec]"
        >
          <BellIcon size={18} />
          {due > 0 && <span className="absolute right-[7px] top-[7px] h-2 w-2 rounded-full bg-coral ring-2 ring-white" />}
        </button>

        {bellOpen && (
          <div className="absolute right-0 top-[calc(100%+8px)] w-[268px] overflow-hidden rounded-[13px] border border-[#E4E1DA] bg-white shadow-[0_18px_44px_-16px_rgba(25,24,23,.35)]">
            <div className="border-b border-[#EFECE5] px-3.5 py-2.5 text-[12.5px] font-extrabold tracking-[.04em] text-muted">
              TODAY
            </div>
            {notes.map((n, i) => (
              <div key={i} className="px-3.5 py-2.5 text-[13px] leading-[1.5] text-ink">
                {n}
              </div>
            ))}
            {due > 0 && (
              <button
                onClick={() => {
                  onNavigate("review");
                  setBellOpen(false);
                }}
                className="w-full border-t border-[#EFECE5] px-3.5 py-2.5 text-left text-[13px] font-bold text-brand transition hover:bg-cream-soft"
              >
                Start review →
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
