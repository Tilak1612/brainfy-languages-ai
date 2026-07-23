import type { Screen } from "../data";

/**
 * In-app 404. Replaces Vercel's raw platform error page, which printed
 * "404: NOT_FOUND / Code: NOT_FOUND / ID: pdx1::…" and a link to the hosting
 * provider's docs — the first thing a mistyped URL showed a learner.
 */
export default function NotFound({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <div className="anim-fade mx-auto flex max-w-[520px] flex-col items-center pt-16 text-center">
      <div className="font-display text-[64px] font-extrabold leading-none tracking-[-.04em] text-[#5B4BE8]">
        404
      </div>
      <h1 className="mt-4 font-display text-[24px] font-extrabold tracking-[-.025em]">
        This page doesn't exist
      </h1>
      <p className="mt-2 text-[14.5px] leading-[1.55] text-muted">
        The link may be out of date, or the address has a typo. Your progress is safe.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate("dashboard")}
          className="grad-brand rounded-[13px] px-[26px] py-[12px] text-[14.5px] font-bold text-white shadow-[0_10px_26px_-10px_rgba(91,75,232,.7)] transition hover:brightness-[1.07]"
        >
          Go to home
        </button>
        <button
          type="button"
          onClick={() => onNavigate("lesson")}
          className="rounded-[13px] border border-[#E4E1DA] bg-white px-[26px] py-[12px] text-[14.5px] font-bold text-[#4b4842] transition hover:bg-[#f3f1ec]"
        >
          Continue learning
        </button>
      </div>
    </div>
  );
}
