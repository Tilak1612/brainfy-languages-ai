// Bridges the local store to Postgres.
//
// The store stays the source of truth for the UI: it is synchronous and
// optimistic, so the interface never waits on the network. This module pulls
// the signed-in user's rows into it on login, then pushes changes back on a
// debounce. A failed push is left for the next one rather than surfaced — the
// local state is still correct and the next write retries the whole row.
import { supabase } from "./supabase";
import { getState, hydrate, onChange, type State } from "./store";
import type { CardState } from "./srs";

const PUSH_DEBOUNCE_MS = 1200;

/**
 * A row as it actually arrives from PostgREST — every field optional and
 * nullable. Typing these as required is what previously let a null column
 * reach render as "NaN%" and crash the Progress screen; the compiler now
 * forces the coercions in pull().
 */
interface ProgressRow {
  xp?: number | null;
  coins?: number | null;
  streak?: number | null;
  last_active_date?: string | null;
  minutes_today?: number | null;
  daily_goal_min?: number | null;
  today_date?: string | null;
  skills?: Partial<State["skills"]> | null;
  words_learned?: number | null;
  achievements?: string[] | null;
  lessons_completed?: number | null;
  conversations?: number | null;
  daily_minutes?: Record<string, number> | null;
}

interface CardRow {
  card_id: string;
  ease: number;
  interval_days: number;
  due_ts: number;
  reps: number;
  lapses: number;
}

function toProgressRow(s: State, userId: string) {
  return {
    user_id: userId,
    xp: s.xp,
    coins: s.coins,
    streak: s.streak,
    last_active_date: s.lastActiveDate,
    minutes_today: s.minutesToday,
    daily_goal_min: s.dailyGoalMin,
    today_date: s.todayDate,
    skills: s.skills,
    words_learned: s.wordsLearned,
    achievements: s.achievements,
    lessons_completed: s.lessonsCompleted,
    conversations: s.conversations,
    daily_minutes: s.dailyMinutes,
    updated_at: new Date().toISOString(),
  };
}

/** Load the user's progress and cards into the store. */
export async function pull(userId: string): Promise<void> {
  if (!supabase) return;

  const [{ data: progress }, { data: cardRows }] = await Promise.all([
    supabase.from("lang_progress").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("lang_srs_cards").select("*").eq("user_id", userId),
  ]);

  const cards: Record<string, CardState> = {};
  for (const c of (cardRows ?? []) as CardRow[]) {
    cards[c.card_id] = {
      ease: c.ease,
      intervalDays: c.interval_days,
      dueTs: Number(c.due_ts),
      reps: c.reps,
      lapses: c.lapses,
    };
  }

  if (!progress) {
    // The signup trigger should have made this row; if it is genuinely absent
    // keep whatever the store has and let the first push create it.
    hydrate({ cards });
    return;
  }

  const p = progress as ProgressRow;
  // Coerce every field. A nullable column, a schema drift, or a partial row
  // used to flow straight into render: a null daily_goal_min made the dashboard
  // compute 0/0 and display "NaN%", and a null skills object crashed the
  // Progress screen outright (property read on null, no error boundary).
  const num = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;

  hydrate({
    xp: num(p.xp, 0),
    coins: num(p.coins, 0),
    streak: num(p.streak, 0),
    lastActiveDate: p.last_active_date ?? null,
    minutesToday: num(p.minutes_today, 0),
    // Never 0 — it is a denominator on the dashboard ring.
    dailyGoalMin: Math.max(1, num(p.daily_goal_min, 25)),
    todayDate: p.today_date ?? new Date().toISOString().slice(0, 10),
    skills: {
      speaking: num(p.skills?.speaking, 0),
      listening: num(p.skills?.listening, 0),
      vocabulary: num(p.skills?.vocabulary, 0),
      grammar: num(p.skills?.grammar, 0),
      reading: num(p.skills?.reading, 0),
    },
    wordsLearned: num(p.words_learned, 0),
    achievements: Array.isArray(p.achievements) ? p.achievements : [],
    lessonsCompleted: num(p.lessons_completed, 0),
    conversations: num(p.conversations, 0),
    dailyMinutes:
      p.daily_minutes && typeof p.daily_minutes === "object" ? p.daily_minutes : {},
    cards,
  });
}

/** Write the whole progress row plus any cards that changed since last push. */
async function push(userId: string, prevCards: Record<string, CardState>) {
  if (!supabase) return;
  const s = getState();

  await supabase.from("lang_progress").upsert(toProgressRow(s, userId), { onConflict: "user_id" });

  // Only send cards whose scheduling actually moved.
  const dirty = Object.entries(s.cards).filter(([id, c]) => {
    const before = prevCards[id];
    return !before || before.dueTs !== c.dueTs || before.reps !== c.reps || before.ease !== c.ease;
  });
  if (dirty.length) {
    await supabase.from("lang_srs_cards").upsert(
      dirty.map(([card_id, c]) => ({
        user_id: userId,
        card_id,
        ease: c.ease,
        interval_days: c.intervalDays,
        due_ts: c.dueTs,
        reps: c.reps,
        lapses: c.lapses,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "user_id,card_id" },
    );
  }
}

let stop: (() => void) | null = null;

/** Mirror every store change to Postgres for this user until stopSync(). */
export function startSync(userId: string) {
  stopSync();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastPushedCards = { ...getState().cards };

  const unsub = onChange(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const snapshot = { ...getState().cards };
      void push(userId, lastPushedCards)
        .then(() => {
          lastPushedCards = snapshot;
        })
        .catch(() => {
          /* keep lastPushedCards so the next push retries these rows */
        });
    }, PUSH_DEBOUNCE_MS);
  });

  stop = () => {
    if (timer) clearTimeout(timer);
    unsub();
  };
}

export function stopSync() {
  stop?.();
  stop = null;
}
