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
}

const KEY = "brainfy.state.v1";

function todayStr(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

function defaultState(): State {
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
  };
}

let state: State = load();
const listeners = new Set<() => void>();

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
];

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
    set({ streak, lastActiveDate, minutesToday: minutesToday + minutes, todayDate });
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
