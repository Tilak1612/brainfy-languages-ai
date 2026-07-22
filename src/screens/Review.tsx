import { useMemo, useState } from "react";
import type { Screen } from "../data";
import { BackIcon } from "../components/icons";
import { useContent } from "../lib/content";
import { actions, getState } from "../lib/store";
import { isDue } from "../lib/srs";
import type { Grade } from "../lib/srs";

const GRADES: { g: Grade; label: string; cls: string }[] = [
  { g: "again", label: "Again", cls: "border-[#FADDD2] text-coral-deep hover:bg-[#FFF6F3]" },
  { g: "hard", label: "Hard", cls: "border-[#F3E2C0] text-gold-deep hover:bg-[#FDF6E8]" },
  { g: "good", label: "Good", cls: "border-[#CBD9F5] text-blue hover:bg-[#EEF3FD]" },
  { g: "easy", label: "Easy", cls: "border-[#B8E6D2] text-green hover:bg-[#E3F6EE]" },
];

export default function Review({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { vocab } = useContent();

  // Build today's queue from due cards (unseen count as due). Recomputed when
  // the deck arrives from the database, but NOT when card state changes — the
  // queue must stay stable while you work through it, or grading a card would
  // remove it mid-session and shuffle the remaining ones.
  const queue = useMemo(() => {
    const now = Date.now();
    const cards = getState().cards;
    return vocab.filter((c) => {
      const st = cards[c.id];
      return !st || isDue(st, now);
    });
  }, [vocab]);

  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  if (queue.length === 0) {
    return <Empty onNavigate={onNavigate} title="All caught up!" body="No cards are due right now. Come back later or start a lesson." />;
  }

  if (pos >= queue.length) {
    return (
      <Empty
        onNavigate={onNavigate}
        title={`Reviewed ${reviewed} cards`}
        body="Nice — your schedule is updated. Cards you found hard will come back sooner."
      />
    );
  }

  const card = queue[pos];
  const seen = getState().cards[card.id];
  const isNew = !seen;

  function grade(g: Grade) {
    actions.reviewCard(card.id, g, { newWord: isNew });
    actions.addXp(g === "again" ? 1 : 3);
    setRevealed(false);
    setReviewed((r) => r + 1);
    setPos((p) => p + 1);
    if (pos + 1 >= queue.length) actions.registerActivity(3);
  }

  return (
    <div className="anim-fade mx-auto max-w-[620px]">
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
            style={{ width: `${(pos / queue.length) * 100}%` }}
          />
        </div>
        <div className="text-[13.5px] font-bold text-muted">
          {pos + 1} / {queue.length}
        </div>
      </div>

      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[24px] border border-[#E7E4DD] bg-white px-5 py-10 text-center shadow-[0_1px_2px_rgba(20,20,30,.04)] md:min-h-[300px] md:px-9 md:py-12">
        {isNew && (
          <span className="mb-4 rounded-full bg-brand-tint px-3 py-1 text-[11px] font-extrabold tracking-[.04em] text-brand">
            NEW WORD
          </span>
        )}
        <h1 className="m-0 font-display text-[32px] font-extrabold tracking-[-.02em] md:text-[40px]">{card.term}</h1>
        {revealed ? (
          <>
            <div className="mt-2 font-mono text-[15px] text-muted">{card.ipa}</div>
            <div role="status" className="mt-4 text-[22px] font-bold text-green">{card.translation}</div>
          </>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="mt-6 rounded-[12px] border border-[#E4E1DA] bg-white px-6 py-3 text-[14px] font-bold text-[#4b4842] transition hover:bg-[#f3f1ec]"
          >
            Show answer
          </button>
        )}
      </div>

      {revealed && (
        <div className="anim-fade mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
          {GRADES.map(({ g, label, cls }) => (
            <button
              key={g}
              onClick={() => grade(g)}
              className={`rounded-[13px] border-[1.5px] bg-white py-3 text-[14px] font-bold transition ${cls}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {!revealed && (
        <p className="mt-4 text-center text-[13px] text-muted">
          Recall the meaning, then reveal and rate how well you knew it.
        </p>
      )}
    </div>
  );
}

function Empty({
  onNavigate,
  title,
  body,
}: {
  onNavigate: (s: Screen) => void;
  title: string;
  body: string;
}) {
  return (
    <div className="anim-fade mx-auto max-w-[520px] text-center">
      <h1 className="m-0 mt-12 font-display text-[28px] font-extrabold tracking-[-.025em]">{title}</h1>
      <p className="mx-auto mt-2 max-w-[380px] text-[15px] text-[#6b6862]">{body}</p>
      <div className="mt-8 flex justify-center gap-3">
        <button
          onClick={() => onNavigate("lesson")}
          className="rounded-[13px] border border-[#E4E1DA] bg-white px-6 py-3 text-[14px] font-bold text-[#4b4842] transition hover:bg-[#f3f1ec]"
        >
          Start a lesson
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
