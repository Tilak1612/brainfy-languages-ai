import { useEffect, useRef, useState } from "react";
import type { Screen } from "../data";
import { actions, useStore, cefrLevel } from "../lib/store";
import { authEnabled } from "../lib/supabase";
import { useAuth, signOut } from "../lib/auth";
import { useBilling, startCheckout, openPortal } from "../lib/billing";
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
  // null on the 404 route: nothing should look active.
  screen: Screen | null;
  onNavigate: (s: Screen) => void;
}) {
  const xp = useStore((s) => s.xp);
  const streak = useStore((s) => s.streak);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { session } = useAuth();
  // Same derivation the Progress screen uses — these used to disagree (B2 vs A1).
  const level = cefrLevel(useStore((s) => s));
  const billing = useBilling();

  // Signed in: show who you actually are. Demo mode: the design's persona.
  const meta = session?.user?.user_metadata as { display_name?: string } | undefined;
  const displayName = authEnabled
    ? meta?.display_name || session?.user?.email?.split("@")[0] || "Learner"
    : "Sofia Alvarez";
  const initials = displayName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "L";

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    // Hidden below md — BottomNav takes over there. At 264px this consumed 70%
    // of a 375px phone screen, leaving 111px for content.
    <aside
      aria-label="Main"
      className="hidden w-[264px] flex-none flex-col gap-1.5 bg-sidebar px-4 py-[22px] text-[#EDECF0] md:flex"
    >
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
          {/* Every claim here must be a shipping feature. The previous copy
              promised "all 200+ languages & exam coaching" — the app is
              English-only and has neither. Avoid "unlimited": Pro is capped at
              CHAT_HOURLY_LIMIT (40/hr). */}
          <div className="mb-3 text-[12.5px] leading-[1.5] text-[#9d9baa]">
            Voice practice with every tutor, custom tutors and pronunciation feedback.
          </div>
          <button
            onClick={async () => {
              if (busy) return;
              setBusy(true);
              const ok = billing.isPro ? await openPortal() : await startCheckout("monthly");
              if (!ok) {
                setBusy(false);
                alert("Billing isn't configured on this deployment yet.");
              }
              // On success the browser navigates to Stripe; leave busy set.
            }}
            disabled={busy || !billing.ready}
            className="grad-brand w-full rounded-[10px] py-[9px] text-[13px] font-bold text-white transition hover:brightness-[1.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "One moment…" : billing.isPro ? "Manage billing" : "Upgrade"}
          </button>
        </div>

        <div ref={menuRef} className="relative">
          {menuOpen && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 overflow-hidden rounded-xl border border-white/[.1] bg-[#211f2b] py-1 shadow-[0_18px_44px_-16px_rgba(0,0,0,.7)]">
              <div className="px-3 py-2 text-[11.5px] leading-[1.5] text-[#8C8A96]">
                {xp.toLocaleString()} XP · {streak}-day streak
              </div>
              <button
                onClick={() => {
                  if (
                    confirm(
                      "Reset your progress? Your XP, streak and review history will be cleared. This cannot be undone.",
                    )
                  ) {
                    actions.reset();
                    setMenuOpen(false);
                  }
                }}
                className="w-full border-t border-white/[.08] px-3 py-2 text-left text-[12.5px] font-semibold text-[#e9e7f0] transition hover:bg-white/[.06]"
              >
                Reset progress
              </button>
              {authEnabled && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    void signOut();
                  }}
                  className="w-full border-t border-white/[.08] px-3 py-2 text-left text-[12.5px] font-semibold text-[#e9e7f0] transition hover:bg-white/[.06]"
                >
                  Sign out
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => setMenuOpen((m) => !m)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition hover:bg-white/[.06]"
          >
            <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-[linear-gradient(135deg,#FFB27A,#FF6B4A)] text-[13px] font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1 leading-[1.15]">
              <div className="truncate text-[13px] font-bold">{displayName}</div>
              <div className="text-[11.5px] text-[#8C8A96]">{level} · Spanish → English</div>
            </div>
            <ChevronDownIcon size={16} className="text-[#8C8A96]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
