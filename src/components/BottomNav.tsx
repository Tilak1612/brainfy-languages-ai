import type { Screen } from "../data";
import { HomeIcon, MicIcon, BookIcon, WaveIcon, ChartIcon } from "./icons";

// Mobile navigation. The 264px sidebar consumed 70% of a 375px screen, so below
// the `md` breakpoint it is replaced by this bar. Bottom tabs are the right
// pattern for a daily-use learning app — thumb-reachable, always visible, and
// what every competitor in this category uses.
//
// Five destinations, not the sidebar's six: "AI Tutors" is reachable from the
// dashboard's tutor cards and from the Voice screen, and a sixth tab would push
// each target below the ~44px minimum comfortable touch size on a 320px screen.
interface Tab {
  key: Screen;
  label: string;
  Icon: (p: { size?: number }) => React.ReactElement;
}

const TABS: Tab[] = [
  { key: "dashboard", label: "Home", Icon: HomeIcon },
  { key: "voice", label: "Tutor", Icon: MicIcon },
  { key: "lesson", label: "Learn", Icon: BookIcon },
  { key: "pron", label: "Speak", Icon: WaveIcon },
  { key: "progress", label: "Progress", Icon: ChartIcon },
];

export default function BottomNav({
  screen,
  onNavigate,
}: {
  // null on the 404 route: nothing should look active.
  screen: Screen | null;
  onNavigate: (s: Screen) => void;
}) {
  return (
    /* env(safe-area-inset-bottom) keeps the bar clear of the iPhone home indicator. */
    <nav
      aria-label="Main"
      className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-[#E4E1DA] bg-cream/95 backdrop-blur-[10px] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {TABS.map(({ key, label, Icon }) => {
        const active = screen === key;
        return (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-bold transition ${
              active ? "text-brand" : "text-muted"
            }`}
          >
            <Icon size={21} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
