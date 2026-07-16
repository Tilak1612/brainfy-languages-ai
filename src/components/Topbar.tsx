import { SearchIcon, ChevronDownIcon, FlameIcon, StarIcon, BellIcon } from "./icons";
import { useStore } from "../lib/store";

export default function Topbar() {
  const streak = useStore((s) => s.streak);
  const xp = useStore((s) => s.xp);

  return (
    <header className="relative z-[5] flex h-[66px] flex-none items-center gap-4 border-b border-[#E4E1DA] bg-cream/[.82] px-7 backdrop-blur-[10px]">
      <div className="mr-auto flex min-w-[150px] max-w-[420px] flex-1 items-center gap-2.5 overflow-hidden whitespace-nowrap rounded-[11px] border border-[#E4E1DA] bg-white px-[13px] py-[9px] text-[#8b887f]">
        <SearchIcon size={16} className="flex-none" />
        <span className="overflow-hidden text-ellipsis text-[13.5px]">Search lessons, tutors, words…</span>
      </div>

      <div className="flex items-center gap-[7px] rounded-full border border-[#E4E1DA] bg-white py-1.5 pl-2 pr-3">
        <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-brand-tint text-[10.5px] font-extrabold text-brand">EN</div>
        <span className="text-[13px] font-semibold">English</span>
        <ChevronDownIcon size={15} className="text-[#8b887f]" />
      </div>

      <div className="flex items-center gap-1.5 rounded-full bg-[#FFEDE7] px-[13px] py-[7px] text-[13.5px] font-extrabold text-coral-deep">
        <FlameIcon size={15} />
        {streak}
      </div>

      <div className="flex items-center gap-1.5 rounded-full border border-[#E4E1DA] bg-white px-[13px] py-[7px] text-[13.5px] font-extrabold text-ink">
        <StarIcon size={15} />
        {xp.toLocaleString()}
      </div>

      <button className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-[#E4E1DA] bg-white text-[#4b4842] transition hover:bg-[#f3f1ec]">
        <BellIcon size={18} />
      </button>
    </header>
  );
}
