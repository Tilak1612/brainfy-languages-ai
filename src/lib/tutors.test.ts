// The product's core claim is that tutors have distinct personalities. Every
// tutor previously opened with the identical sentence, contradicting that
// before the learner typed anything.
import { describe, it, expect } from "vitest";
import { PERSONAS, greetingFor, buildCustom } from "./tutors";

describe("greetingFor", () => {
  it("gives every built-in tutor a different opening line", () => {
    const lines = PERSONAS.map((p) => greetingFor(p, "Sam"));
    expect(new Set(lines).size).toBe(PERSONAS.length);
  });

  it("addresses the learner by name", () => {
    for (const p of PERSONAS) {
      expect(greetingFor(p, "Sam")).toContain("Sam");
    }
  });

  it("leaves no unsubstituted placeholder", () => {
    for (const p of PERSONAS) {
      expect(greetingFor(p, "Sam")).not.toContain("{{");
    }
  });

  it("opens a custom tutor in character with its stated focus", () => {
    const p = buildCustom({
      name: "Priya",
      focus: "Travel",
      personality: "Playful",
      accent: "British",
    });
    const line = greetingFor(p, "Sam");
    expect(line).toContain("Priya");
    expect(line.toLowerCase()).toContain("travel");
  });
});

describe("persona badges", () => {
  it("no longer asserts a CEFR level", () => {
    // Badges hardcoded "· B2" for everyone, contradicting the level the
    // Progress screen computes from real mastery.
    for (const p of PERSONAS) {
      expect(p.badge).not.toMatch(/\b[ABC][12]\b/);
    }
  });

  it("never ships a prompt to the client", () => {
    for (const p of PERSONAS) {
      expect(p).not.toHaveProperty("system");
    }
  });
});
