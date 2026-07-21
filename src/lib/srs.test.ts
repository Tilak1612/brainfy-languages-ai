// The spaced-repetition scheduler decides when every card comes back. It had
// no tests, and a scheduling bug is invisible — cards quietly arrive at the
// wrong time and the learner never knows why review feels wrong.
import { describe, it, expect } from "vitest";
import { freshCard, schedule, isDue, type CardState } from "./srs";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

describe("freshCard", () => {
  it("starts due immediately so new cards enter the queue", () => {
    const c = freshCard(NOW);
    expect(c.reps).toBe(0);
    expect(isDue(c, NOW)).toBe(true);
  });

  it("uses the SM-2 default ease of 2.5", () => {
    expect(freshCard(NOW).ease).toBe(2.5);
  });
});

describe("schedule", () => {
  it("advances the interval on a good answer", () => {
    const first = schedule(freshCard(NOW), "good", NOW);
    expect(first.reps).toBe(1);
    expect(first.intervalDays).toBeGreaterThan(0);
    expect(first.dueTs).toBeGreaterThan(NOW);
  });

  it("grows the interval across successive good answers", () => {
    let c = freshCard(NOW);
    const seen: number[] = [];
    for (let i = 0; i < 4; i++) {
      c = schedule(c, "good", NOW + i * DAY);
      seen.push(c.intervalDays);
    }
    // Each repetition should schedule further out than the last.
    for (let i = 1; i < seen.length; i++) {
      expect(seen[i]).toBeGreaterThan(seen[i - 1]);
    }
  });

  it("resets the interval and counts a lapse on 'again'", () => {
    let c = schedule(freshCard(NOW), "good", NOW);
    c = schedule(c, "good", NOW + DAY);
    const before = c.intervalDays;
    const lapsed = schedule(c, "again", NOW + 2 * DAY);

    expect(lapsed.lapses).toBe(c.lapses + 1);
    expect(lapsed.intervalDays).toBeLessThan(before);
  });

  it("never lets ease fall below the SM-2 floor of 1.3", () => {
    let c = freshCard(NOW);
    // Punish the same card repeatedly; ease must not run away downward.
    for (let i = 0; i < 20; i++) c = schedule(c, "again", NOW + i * DAY);
    expect(c.ease).toBeGreaterThanOrEqual(1.3);
  });

  it("rewards 'easy' with a longer interval than 'hard'", () => {
    const base = schedule(freshCard(NOW), "good", NOW);
    const easy = schedule(base, "easy", NOW + DAY);
    const hard = schedule(base, "hard", NOW + DAY);
    expect(easy.intervalDays).toBeGreaterThan(hard.intervalDays);
  });

  it("always produces a finite, positive due timestamp", () => {
    // Guards the NaN/Infinity class of bug that would render as a broken date.
    let c = freshCard(NOW);
    for (const g of ["good", "again", "easy", "hard", "good"] as const) {
      c = schedule(c, g, NOW);
      expect(Number.isFinite(c.dueTs)).toBe(true);
      expect(Number.isFinite(c.intervalDays)).toBe(true);
      expect(c.intervalDays).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("isDue", () => {
  it("is false before the due date and true after", () => {
    const c: CardState = { ease: 2.5, intervalDays: 3, dueTs: NOW + 3 * DAY, reps: 1, lapses: 0 };
    expect(isDue(c, NOW)).toBe(false);
    expect(isDue(c, NOW + 3 * DAY + 1)).toBe(true);
  });
});
