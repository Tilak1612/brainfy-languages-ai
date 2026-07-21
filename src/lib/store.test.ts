// Guards the "no fabricated progress" invariant. Every number these cover was
// hardcoded or simulated at some point in this codebase's history.
import { describe, it, expect } from "vitest";
import { cefrLevel } from "./store";

const S = (skills: Record<string, number>) =>
  ({ skills, dailyMinutes: {}, dailyGoalMin: 25 }) as never;

describe("cefrLevel", () => {
  it("does not hand a new account B2 — the UI used to hardcode it", () => {
    expect(cefrLevel(S({ speaking: 0, listening: 0, vocabulary: 0, grammar: 0, reading: 0 })))
      .toBe("A1");
  });

  it("rises with measured mastery", () => {
    const at = (n: number) =>
      cefrLevel(S({ speaking: n, listening: n, vocabulary: n, grammar: n, reading: n }));
    expect(at(25)).toBe("A2");
    expect(at(45)).toBe("B1");
    expect(at(65)).toBe("B2");
    expect(at(85)).toBe("C1");
    expect(at(97)).toBe("C2");
  });

  it("never returns a level outside the CEFR scale", () => {
    const valid = ["A1", "A2", "B1", "B2", "C1", "C2"];
    for (let n = 0; n <= 100; n += 5) {
      const lvl = cefrLevel(S({ speaking: n, listening: n, vocabulary: n, grammar: n, reading: n }));
      expect(valid).toContain(lvl);
    }
  });
});
