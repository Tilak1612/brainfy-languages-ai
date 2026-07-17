import type { Screen } from "../data";
import { tutors, recommended } from "../data";
import { MicIcon, WaveIcon, LessonPairIcon, CalendarIcon } from "../components/icons";
import { useStore, dueCount } from "../lib/store";
import { setActive, useActiveTutor } from "../lib/tutors";
import { vocabDeck } from "../content/learning";

const cardHover =
  "transition-[.18s] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-14px_rgba(20,20,30,.22)]";

const RING_C = 2 * Math.PI * 62; // 389.5

export default function Dashboard({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const minutesToday = useStore((s) => s.minutesToday);
  const dailyGoalMin = useStore((s) => s.dailyGoalMin);
  useStore((s) => s.cards); // re-render when SRS state changes
  const due = dueCount(vocabDeck.map((v) => v.id));
  const activeTutor = useActiveTutor();

  const pct = Math.min(100, Math.round((minutesToday / dailyGoalMin) * 100));
  const minutesLeft = Math.max(0, dailyGoalMin - minutesToday);
  const dashOffset = RING_C * (1 - pct / 100);

  const quickActions = [
    { key: "voice" as Screen, title: "Voice chat", sub: `Talk with ${activeTutor.name}`, bg: "#EEEBFD", icon: <MicIcon size={19} className="text-brand" /> },
    { key: "pron" as Screen, title: "Pronounce", sub: "Fix your accent", bg: "#FFEDE7", icon: <WaveIcon size={19} className="text-coral" /> },
    { key: "lesson" as Screen, title: "Lesson", sub: "Build sentences", bg: "#E3F6EE", icon: <LessonPairIcon size={19} color="#1FA971" /> },
    { key: "review" as Screen, title: "Review", sub: `${due} word${due === 1 ? "" : "s"} due`, bg: "#FDF0D8", icon: <CalendarIcon size={19} color="#C6890A" /> },
  ];

  return (
    <div className="anim-fade mx-auto max-w-[1180px]">
      <div className="mb-[26px] flex items-end justify-between gap-5">
        <div>
          <div className="mb-[5px] text-[13.5px] font-bold tracking-[.02em] text-[#8b887f]">Good afternoon, Sofia</div>
          <h1 className="m-0 font-display text-[32px] font-extrabold leading-[1.05] tracking-[-.025em]">Let's keep your streak alive.</h1>
        </div>
        <button
          onClick={() => onNavigate("voice")}
          className="grad-brand flex items-center gap-[9px] rounded-[13px] px-5 py-[13px] text-[14.5px] font-bold text-white shadow-[0_10px_26px_-10px_rgba(91,75,232,.75)] transition hover:-translate-y-px hover:brightness-[1.07]"
        >
          <MicIcon size={18} className="text-white" />
          Start a conversation
        </button>
      </div>

      <div className="mb-[18px] grid grid-cols-[1.6fr_1fr] gap-[18px]">
        <div className="relative overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#211f2b,#17161C)] p-[26px] text-white">
          <div className="absolute -right-10 -top-10 h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle,rgba(124,108,246,.5),transparent_70%)]" />
          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-[7px] rounded-full border border-white/[.14] bg-white/10 px-[11px] py-[5px] text-[11.5px] font-bold tracking-[.03em]">
              <span className="h-1.5 w-1.5 rounded-full bg-mint" />
              CONTINUE LEARNING
            </div>
            <h2 className="m-0 mb-1.5 font-display text-[24px] font-bold tracking-[-.02em]">Ordering at a Café</h2>
            <div className="mb-5 text-[14px] text-[#a9a7b6]">Unit 4 · Real-world conversation · 6 min left</div>
            <div className="mb-[22px] h-2 max-w-[340px] overflow-hidden rounded-full bg-white/[.12]">
              <div className="h-full w-[68%] rounded-full bg-[linear-gradient(90deg,#8B7CF6,#5B4BE8)]" />
            </div>
            <button
              onClick={() => onNavigate("lesson")}
              className="rounded-[11px] bg-white px-5 py-[11px] text-[14px] font-bold text-[#17161C] transition hover:brightness-[1.05]"
            >
              Resume lesson
            </button>
          </div>
        </div>

        <div className="flex flex-col rounded-[22px] border border-[#E7E4DD] bg-white p-6 shadow-[0_1px_2px_rgba(20,20,30,.04)]">
          <div className="mb-0.5 font-display text-[16px] font-bold">Daily goal</div>
          <div className="mb-3.5 text-[13px] text-[#8b887f]">
            {minutesToday} of {dailyGoalMin} min completed
          </div>
          <div className="relative flex flex-1 items-center justify-center">
            <svg width="150" height="150" viewBox="0 0 150 150">
              <circle cx="75" cy="75" r="62" fill="none" stroke="#EFEDE7" strokeWidth="15" />
              <circle
                cx="75"
                cy="75"
                r="62"
                fill="none"
                stroke="url(#rg)"
                strokeWidth="15"
                strokeLinecap="round"
                strokeDasharray={RING_C.toFixed(1)}
                strokeDashoffset={dashOffset.toFixed(1)}
                transform="rotate(-90 75 75)"
                style={{ transition: "stroke-dashoffset .5s ease" }}
              />
              <defs>
                <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#8B7CF6" />
                  <stop offset="1" stopColor="#5B4BE8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center">
              <div className="font-display text-[30px] font-extrabold tracking-[-.02em]">{pct}%</div>
              <div className="text-[11.5px] font-semibold text-[#8b887f]">
                {minutesLeft > 0 ? `${minutesLeft} min to go` : "goal met!"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-[26px] grid grid-cols-4 gap-3.5">
        {quickActions.map((a) => (
          <button key={a.title} onClick={() => onNavigate(a.key)} className={`cursor-pointer rounded-[18px] border border-[#E7E4DD] bg-white p-[18px] text-left ${cardHover}`}>
            <div className="mb-3 flex h-[38px] w-[38px] items-center justify-center rounded-[11px]" style={{ background: a.bg }}>
              {a.icon}
            </div>
            <div className="mb-0.5 text-[14.5px] font-bold">{a.title}</div>
            <div className="text-[12.5px] text-[#8b887f]">{a.sub}</div>
          </button>
        ))}
      </div>

      <div className="mb-3.5 flex items-baseline justify-between">
        <h3 className="m-0 font-display text-[19px] font-bold tracking-[-.02em]">Your AI tutors</h3>
        <button onClick={() => onNavigate("tutors")} className="cursor-pointer text-[13.5px] font-bold text-brand">Browse all →</button>
      </div>
      <div className="mb-[26px] grid grid-cols-4 gap-3.5">
        {tutors.map((t) => (
          <button
            key={t.name}
            // Pick the tutor you actually clicked, rather than dropping into a
            // session with whoever happened to be active.
            onClick={() => {
              setActive(t.name);
              onNavigate("voice");
            }}
            className={`cursor-pointer rounded-[18px] border border-[#E7E4DD] bg-white p-[18px] text-left ${cardHover}`}
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] font-display text-[17px] font-extrabold text-white" style={{ background: t.grad }}>
                {t.initials}
              </div>
              <div className="leading-[1.2]">
                <div className="text-[15px] font-bold">{t.name}</div>
                <div className="text-[12px] text-[#8b887f]">{t.role}</div>
              </div>
            </div>
            <div className="min-h-[38px] text-[12.5px] leading-[1.5] text-[#6b6862]">{t.blurb}</div>
          </button>
        ))}
      </div>

      <h3 className="m-0 mb-3.5 font-display text-[19px] font-bold tracking-[-.02em]">Recommended for you</h3>
      <div className="grid grid-cols-3 gap-3.5">
        {recommended.map((r) => (
          <button key={r.title} onClick={() => onNavigate("lesson")} className={`cursor-pointer overflow-hidden rounded-[18px] border border-[#E7E4DD] bg-white text-left ${cardHover}`}>
            <div className="flex h-24 items-end p-3" style={{ background: r.grad }}>
              <span className="rounded-full bg-white/90 px-[9px] py-1 text-[11px] font-extrabold tracking-[.02em] text-ink">{r.tag}</span>
            </div>
            <div className="px-4 pb-[17px] pt-[15px]">
              <div className="mb-[3px] text-[15px] font-bold">{r.title}</div>
              <div className="text-[12.5px] text-[#8b887f]">{r.meta}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
