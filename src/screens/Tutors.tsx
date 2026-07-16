import type { Screen } from "../data";
import { tutors } from "../data";
import { PlusIcon } from "../components/icons";

export default function Tutors({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <div className="anim-fade mx-auto max-w-[1180px]">
      <h1 className="m-0 mb-1 font-display text-[28px] font-extrabold tracking-[-.025em]">
        Choose your AI tutor
      </h1>
      <div className="mb-6 text-[14px] text-[#8b887f]">
        Each tutor has a distinct personality, teaching style and voice. Persistent memory means they
        remember every session.
      </div>

      <div className="grid grid-cols-3 gap-4">
        {tutors.map((t) => (
          <div
            key={t.name}
            className="flex flex-col rounded-[22px] border border-[#E7E4DD] bg-white p-6"
          >
            <div className="mb-4 flex items-center gap-3.5">
              <div
                className="flex h-[58px] w-[58px] items-center justify-center rounded-[17px] font-display text-[22px] font-extrabold text-white"
                style={{ background: t.grad }}
              >
                {t.initials}
              </div>
              <div className="leading-[1.25]">
                <div className="font-display text-[18px] font-bold">{t.name}</div>
                <div className="text-[13px] font-bold text-brand">{t.role}</div>
              </div>
            </div>
            <div className="mb-[18px] flex-1 text-[13.5px] leading-[1.55] text-[#6b6862]">
              {t.blurb}
            </div>
            <button
              onClick={() => onNavigate("voice")}
              className="grad-brand rounded-xl py-[11px] text-[14px] font-bold text-white transition hover:brightness-[1.06]"
            >
              Start session
            </button>
          </div>
        ))}

        {/* Custom tutor */}
        <div className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[22px] border-[1.5px] border-dashed border-[#CFCBFA] p-6 text-center transition-colors hover:border-brand hover:bg-cream-soft">
          <div className="mb-4 flex h-[58px] w-[58px] items-center justify-center rounded-[17px] bg-brand-tint">
            <PlusIcon size={26} className="text-brand" />
          </div>
          <div className="mb-[5px] font-display text-[17px] font-bold">Build a custom tutor</div>
          <div className="text-[13px] leading-[1.5] text-[#8b887f]">
            Pick a personality, voice, accent and focus area.
          </div>
        </div>
      </div>
    </div>
  );
}
