import type { Screen } from "../data";
import {
  BrandLogoIcon,
  HomeIcon,
  MicIcon,
  BookIcon,
  WaveIcon,
  ChartIcon,
  UserIcon,
  ChevronDownIcon,
} from "./icons";

interface NavItem {
  key: Screen;
  label: string;
  Icon: (p: { size?: number }) => React.ReactElement;
}

const NAV: NavItem[] = [
  { key: "dashboard", label: "Home", Icon: HomeIcon },
  { key: "voice", label: "Voice Tutor", Icon: MicIcon },
  { key: "lesson", label: "Lessons", Icon: BookIcon },
  { key: "pron", label: "Pronunciation", Icon: WaveIcon },
  { key: "progress", label: "Progress", Icon: ChartIcon },
  { key: "tutors", label: "AI Tutors", Icon: UserIcon },
];

export default function Sidebar({
  screen,
  onNavigate,
}: {
  screen: Screen;
  onNavigate: (s: Screen) => void;
}) {
  return (
    <aside className="flex w-[264px] flex-none flex-col gap-1.5 bg-sidebar px-4 py-[22px] text-[#EDECF0]">
      {/* Brand */}
      <div className="flex items-center gap-[11px] px-2 pb-[18px] pt-1">
        <div className="grad-brand-3 flex h-[34px] w-[34px] items-center justify-center rounded-[10px] shadow-[0_6px_18px_-6px_rgba(91,75,232,.7)]">
          <BrandLogoIcon />
        </div>
        <div className="leading-[1.05]">
          <div className="font-display text-[16px] font-bold tracking-[-.02em]">
            Brainfy
          </div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[.14em] text-[#8C8A96]">
            Languages AI
          </div>
        </div>
      </div>

      {/* Nav */}
      {NAV.map(({ key, label, Icon }) => {
        const active = screen === key;
        return (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            className={[
              "flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-left text-[14px] font-semibold transition-colors",
              active
                ? "grad-brand text-white"
                : "bg-transparent text-[#B7B5C0] hover:bg-white/[.06]",
            ].join(" ")}
          >
            <Icon size={18} />
            {label}
          </button>
        );
      })}

      {/* Footer: Pro card + profile */}
      <div className="mt-auto flex flex-col gap-3.5">
        <div className="rounded-2xl border border-white/[.08] bg-[linear-gradient(150deg,#2a2836,#1d1b26)] p-4">
          <div className="mb-[5px] flex items-center gap-2 font-display text-[14px] font-bold">
            <span className="grad-brand h-[7px] w-[7px] rounded-full" />
            Brainfy Pro
          </div>
          <div className="mb-3 text-[12.5px] leading-[1.5] text-[#9d9baa]">
            Unlimited voice minutes, all 200+ languages & exam coaching.
          </div>
          <button className="grad-brand w-full rounded-[10px] py-[9px] text-[13px] font-bold text-white transition hover:brightness-[1.08]">
            Upgrade
          </button>
        </div>

        <div className="flex items-center gap-2.5 px-1.5 py-1">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#FFB27A,#FF6B4A)] text-[13px] font-bold text-white">
            SA
          </div>
          <div className="flex-1 leading-[1.15]">
            <div className="text-[13px] font-bold">Sofia Alvarez</div>
            <div className="text-[11.5px] text-[#8C8A96]">B2 · Learning EN</div>
          </div>
          <ChevronDownIcon size={16} className="text-[#8C8A96]" />
        </div>
      </div>
    </aside>
  );
}
