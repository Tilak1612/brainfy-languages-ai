// Tiny persistent global store (localStorage + useSyncExternalStore).
// No external deps. This is the client-side "learner graph": XP, streak,
// per-skill mastery, SRS card states, achievements — all real and persisted.

import { useSyncExternalStore } from "react";
import { freshCard, schedule, isDue, type CardState, type Grade } from "./srs";

export type SkillKey = "speaking" | "listening" | "vocabulary" | "grammar" | "reading";

export interface State {
  xp: number;
  coins: number;
  streak: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  minutesToday: number;
  dailyGoalMin: number;
  todayDate: string;
  skills: Record<SkillKey, number>; // 0..100 mastery
  cards: Record<string, CardState>;
  wordsLearned: number;
  achievements: string[];
  lessonsCompleted: number;
  /** Completed AI tutor conversations. Backs the "100 conversations" badge. */
  conversations: number;
  /**
   * Minutes practised per day, keyed YYYY-MM-DD. Without this there was no
   * history at all: the Progress week chart was a fixed array, "+12% vs last
   * week" was uncomputable, and the "perfect week" badge could never unlock.
   * Trimmed to the last 60 days so it cannot grow without bound.
   */
  dailyMinutes: Record<string, number>;
}

/** Rolling window kept in dailyMinutes; enough for a week chart plus comparison. */
const HISTORY_DAYS = 60;

const KEY = "brainfy.state.v1";

/**
 * When a Supabase project is configured, Postgres owns the data: accounts are
 * real, so progress starts at zero and localStorage is not used (it would only
 * leak one account's progress into the next session on a shared browser).
 * Without a project the app runs as the self-contained design demo.
 *
 * Declared before load() because load() reads it.
 */
const localOnly = !import.meta.env.VITE_SUPABASE_URL;

function todayStr(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

/** The numbers from the original design mock. Demo mode only. */
function demoState(): State {
  return {
    xp: 2480,
    coins: 340,
    streak: 24,
    lastActiveDate: null,
    minutesToday: 18,
    dailyGoalMin: 25,
    todayDate: todayStr(),
    skills: { speaking: 82, listening: 74, vocabulary: 68, grammar: 61, reading: 88 },
    cards: {},
    wordsLearned: 862,
    achievements: ["streak21", "conv100", "words500", "perfectweek"],
    lessonsCompleted: 0,
    conversations: 112,
    dailyMinutes: demoWeek(),
  };
}

/** A plausible week for the design demo only. Real accounts start empty. */
function demoWeek(): Record<string, number> {
  const out: Record<string, number> = {};
  const mins = [22, 31, 18, 40, 27, 12, 35];
  for (let i = 6; i >= 0; i--) {
    out[todayStr(Date.now() - i * 86400000)] = mins[6 - i];
  }
  return out;
}

/** What a real new account looks like: nothing earned yet. */
function emptyState(): State {
  return {
    xp: 0,
    coins: 0,
    streak: 0,
    lastActiveDate: null,
    minutesToday: 0,
    dailyGoalMin: 25,
    todayDate: todayStr(),
    skills: { speaking: 0, listening: 0, vocabulary: 0, grammar: 0, reading: 0 },
    cards: {},
    wordsLearned: 0,
    achievements: [],
    lessonsCompleted: 0,
    conversations: 0,
    dailyMinutes: {},
  };
}

function defaultState(): State {
  return localOnly ? demoState() : emptyState();
}

let state: State = load();
const listeners = new Set<() => void>();
const changeHooks = new Set<() => void>();

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaultState();
}

function persist() {
  if (!localOnly) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function set(next: Partial<State>) {
  state = { ...state, ...next };
  persist();
  listeners.forEach((l) => l());
  changeHooks.forEach((h) => h());
}

/**
 * Replace state with rows loaded from the backend. Does not fire change hooks:
 * this is the server's data arriving, and echoing it straight back as a write
 * would be pointless traffic.
 */
export function hydrate(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

/** Observe every mutation. Used by the sync layer to mirror state to Postgres. */
export function onChange(cb: () => void): () => void {
  changeHooks.add(cb);
  return () => {
    changeHooks.delete(cb);
  };
}

/** Wipe in-memory state back to defaults, e.g. on sign-out. */
export function resetToDefaults() {
  state = defaultState();
  listeners.forEach((l) => l());
}

// ---- selectors ----
export function getState(): State {
  return state;
}

export function dueCount(deckIds: string[], now = Date.now()): number {
  return deckIds.filter((id) => {
    const c = state.cards[id];
    return !c || isDue(c, now);
  }).length;
}

// ---- actions ----
// These ids MUST match the tiles rendered by the Progress screen — an id that
// exists only here can be "unlocked" but has nowhere to show up.
const ACH_RULES: { id: string; label: string; test: (s: State) => boolean }[] = [
  { id: "streak21", label: "21-day streak", test: (s) => s.streak >= 21 },
  { id: "words500", label: "500 words", test: (s) => s.wordsLearned >= 500 },
  { id: "days365", label: "365 days", test: (s) => s.streak >= 365 },
  // These three had tiles on the Progress screen but no rule, so they were
  // permanently unwinnable — the counter could never read more than 3 of 6.
  { id: "conv100", label: "100 conversations", test: (s) => s.conversations >= 100 },
  { id: "perfectweek", label: "Perfect week", test: (s) => hitGoalEveryDay(s, 7) },
  { id: "c1level", label: "C1 level", test: (s) => cefrLevel(s) === "C1" || cefrLevel(s) === "C2" },
];

/** True when every one of the last `days` days met the daily goal. */
function hitGoalEveryDay(s: State, days: number): boolean {
  for (let i = 0; i < days; i++) {
    const day = todayStr(Date.now() - i * 86400000);
    if ((s.dailyMinutes[day] ?? 0) < s.dailyGoalMin) return false;
  }
  return true;
}

/**
 * CEFR level derived from mean skill mastery. Previously the UI hardcoded "B2"
 * for everyone, including brand-new accounts with zero mastery. This is a rough
 * proxy, not a certified placement — the UI labels it accordingly.
 */
export function cefrLevel(s: State = state): "A1" | "A2" | "B1" | "B2" | "C1" | "C2" {
  const vals = Object.values(s.skills);
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  if (avg >= 95) return "C2";
  if (avg >= 80) return "C1";
  if (avg >= 60) return "B2";
  if (avg >= 40) return "B1";
  if (avg >= 20) return "A2";
  return "A1";
}

function checkAchievements() {
  const unlocked = [...state.achievements];
  let changed = false;
  for (const r of ACH_RULES) {
    if (!unlocked.includes(r.id) && r.test(state)) {
      unlocked.push(r.id);
      changed = true;
    }
  }
  if (changed) set({ achievements: unlocked });
}

export const actions = {
  /** Call on any learning activity — advances streak once per day, resets daily. */
  registerActivity(minutes = 1) {
    const today = todayStr();
    let { streak, lastActiveDate, minutesToday, todayDate } = state;
    if (todayDate !== today) {
      todayDate = today;
      minutesToday = 0;
    }
    if (lastActiveDate !== today) {
      const yesterday = todayStr(Date.now() - 86400000);
      streak = lastActiveDate === yesterday ? streak + 1 : lastActiveDate === null ? streak : 1;
      lastActiveDate = today;
    }
    const nextMinutes = minutesToday + minutes;

    // Record the day so the week chart and the "perfect week" badge have real
    // history to read. Trimmed to a rolling window so it cannot grow forever.
    const dailyMinutes = { ...state.dailyMinutes, [today]: nextMinutes };
    const cutoff = todayStr(Date.now() - HISTORY_DAYS * 86400000);
    for (const day of Object.keys(dailyMinutes)) {
      if (day < cutoff) delete dailyMinutes[day];
    }

    set({ streak, lastActiveDate, minutesToday: nextMinutes, todayDate, dailyMinutes });
    checkAchievements();
  },

  /** Count a finished AI tutor conversation. Backs the "100 conversations" badge. */
  completeConversation() {
    set({ conversations: state.conversations + 1 });
    checkAchievements();
  },

  addXp(n: number) {
    set({ xp: state.xp + n, coins: state.coins + Math.round(n / 5) });
    checkAchievements();
  },

  /** Nudge a skill's mastery toward 100 on correct, gently down on wrong. */
  recordAnswer(skill: SkillKey, correct: boolean) {
    const cur = state.skills[skill] ?? 50;
    const next = Math.max(0, Math.min(100, cur + (correct ? 2 : -1)));
    set({ skills: { ...state.skills, [skill]: next } });
  },

  reviewCard(id: string, grade: Grade, opts?: { newWord?: boolean }) {
    const now = Date.now();
    const prev = state.cards[id] ?? freshCard(now);
    const wasNew = prev.reps === 0 && !state.cards[id];
    const cards = { ...state.cards, [id]: schedule(prev, grade, now) };
    const words = wasNew && opts?.newWord ? state.wordsLearned + 1 : state.wordsLearned;
    set({ cards, wordsLearned: words });
    this.recordAnswer("vocabulary", grade !== "again");
  },

  completeLesson() {
    set({ lessonsCompleted: state.lessonsCompleted + 1 });
    checkAchievements();
  },

  reset() {
    set(defaultState());
  },
};

// ---- react binding ----
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export const ACHIEVEMENT_LABELS: Record<string, string> = {
  streak21: "21-day streak",
  conv100: "100 conversations",
  words500: "500 words",
  perfectweek: "Perfect week",
  c1level: "C1 level",
  days365: "365 days",
};
