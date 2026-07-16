// Minimal SM-2-style spaced-repetition scheduler.
// A real backend would use FSRS (see the Learning Engine spec); this is the
// client-side version that actually schedules cards and persists state.

export type Grade = "again" | "hard" | "good" | "easy";

export interface CardState {
  ease: number; // ease factor, min 1.3
  intervalDays: number;
  dueTs: number; // epoch ms
  reps: number;
  lapses: number;
}

const DAY = 24 * 60 * 60 * 1000;

export function freshCard(now: number): CardState {
  return { ease: 2.5, intervalDays: 0, dueTs: now, reps: 0, lapses: 0 };
}

const Q: Record<Grade, number> = { again: 1, hard: 3, good: 4, easy: 5 };

export function schedule(card: CardState, grade: Grade, now: number): CardState {
  const q = Q[grade];
  let { ease, intervalDays, reps, lapses } = card;

  ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  if (q < 3) {
    // lapse -> relearn
    reps = 0;
    lapses += 1;
    intervalDays = 0; // due again this session (10 min)
    return { ease, intervalDays, dueTs: now + 10 * 60 * 1000, reps, lapses };
  }

  reps += 1;
  if (reps === 1) intervalDays = 1;
  else if (reps === 2) intervalDays = grade === "easy" ? 6 : 3;
  else intervalDays = Math.round(intervalDays * ease * (grade === "hard" ? 0.7 : 1));

  return { ease, intervalDays, dueTs: now + intervalDays * DAY, reps, lapses };
}

export function isDue(card: CardState, now: number): boolean {
  return card.dueTs <= now;
}
