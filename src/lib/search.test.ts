// Search silently failed on the app's own featured content: it indexed only the
// English answer, so the Spanish prompt shown on the lesson card matched
// nothing, and accented words were unreachable from an English keyboard.
import { describe, it, expect } from "vitest";
import { buildIndex, search } from "./search";
import type { BuilderItem, VocabCard } from "../content/learning";

const lessons: BuilderItem[] = [
  {
    id: "l1",
    prompt: "Quisiera un café, por favor.",
    hint: "Translate to English",
    answer: ["I", "would like", "a", "coffee", "please"],
    bank: ["I", "would like", "a", "coffee", "please", "tea"],
    skill: "grammar",
  },
];
const vocab: VocabCard[] = [
  { id: "v1", term: "mañana", translation: "tomorrow", ipa: "/maˈɲa.na/" },
];
const index = buildIndex(lessons, vocab);
const labels = (q: string) => search(index, q).map((h) => h.label);

describe("search", () => {
  it("finds a lesson by its Spanish prompt — the text actually on screen", () => {
    // The reported bug: this returned "No matches".
    expect(labels("café")).toContain("Quisiera un café, por favor.");
  });

  it("finds the same lesson typed without the accent", () => {
    expect(labels("cafe")).toContain("Quisiera un café, por favor.");
  });

  it("finds a lesson by its English answer too", () => {
    expect(labels("coffee")).toContain("Quisiera un café, por favor.");
  });

  it("finds vocabulary in either language", () => {
    expect(labels("mañana")).toContain("mañana");
    expect(labels("manana")).toContain("mañana");
    expect(labels("tomorrow")).toContain("mañana");
  });

  it("is case-insensitive and ignores punctuation", () => {
    expect(labels("QUISIERA")).toContain("Quisiera un café, por favor.");
    expect(labels("¿cafe?")).toContain("Quisiera un café, por favor.");
  });

  it("returns nothing for a blank query rather than everything", () => {
    expect(search(index, "   ")).toEqual([]);
  });

  it("indexes whatever content it is given, not a bundled copy", () => {
    const bigger = buildIndex(
      [...lessons, { ...lessons[0], id: "l2", prompt: "¿Dónde está la estación?" }],
      vocab,
    );
    expect(search(bigger, "estación").length).toBe(1);
  });
});
