// Search index for the topbar.
//
// Rebuilt from the live content rather than the bundled arrays: it previously
// imported the static lessonItems/vocabDeck, so only the original 5 lessons and
// 12 words were findable even after content moved to Postgres.
//
// It also indexed only the English answer, so searching the Spanish prompt —
// the thing actually shown on the lesson card — returned nothing. Both the
// source phrase and the target translation are searchable now.
import type { Screen } from "../data";
import { tutors } from "../data";
import type { BuilderItem, VocabCard } from "../content/learning";

export interface Hit {
  kind: "Lesson" | "Tutor" | "Word" | "Page";
  label: string;
  detail: string;
  screen: Screen;
  /** Extra text matched against but not displayed (e.g. the other language). */
  alt?: string;
}

const PAGES: Hit[] = [
  { kind: "Page", label: "Voice Tutor", detail: "Live conversation with an AI tutor", screen: "voice" },
  { kind: "Page", label: "Lessons", detail: "Sentence builder practice", screen: "lesson" },
  { kind: "Page", label: "Review", detail: "Spaced repetition drill", screen: "review" },
  { kind: "Page", label: "Speaking practice", detail: "Say a phrase and check it", screen: "pron" },
  { kind: "Page", label: "Progress", detail: "Streak, XP and skill mastery", screen: "progress" },
  { kind: "Page", label: "AI Tutors", detail: "Browse every tutor", screen: "tutors" },
];

export function buildIndex(lessons: BuilderItem[], vocab: VocabCard[]): Hit[] {
  const tutorHits: Hit[] = tutors.map((t) => ({
    kind: "Tutor",
    label: t.name,
    detail: `${t.role} — ${t.blurb}`,
    screen: "tutors",
  }));

  const lessonHits: Hit[] = lessons.map((l) => ({
    kind: "Lesson",
    // Show the Spanish prompt — that is what the lesson card displays.
    label: l.prompt,
    detail: l.answer.join(" "),
    // Match on the English answer too, so either language finds the exercise.
    alt: l.answer.join(" "),
    screen: "lesson",
  }));

  const wordHits: Hit[] = vocab.map((c) => ({
    kind: "Word",
    label: c.term,
    detail: `${c.translation}${c.ipa ? ` · ${c.ipa}` : ""}`,
    alt: c.translation,
    screen: "review",
  }));

  return [...PAGES, ...tutorHits, ...lessonHits, ...wordHits];
}

/**
 * Accent-insensitive fold, so "cafe" finds "café" and "manana" finds "mañana".
 * Without this, a learner typing on an English keyboard cannot find any of the
 * Spanish content — which is most of the content.
 */
function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[¿¡?!.,]/g, "");
}

/** Case- and accent-insensitive substring match, best matches first. */
export function search(index: Hit[], q: string, limit = 8): Hit[] {
  const needle = fold(q.trim());
  if (!needle) return [];
  const scored: Array<{ hit: Hit; score: number }> = [];
  for (const hit of index) {
    const label = fold(hit.label);
    const detail = fold(hit.detail);
    const alt = fold(hit.alt ?? "");
    const score = label.startsWith(needle)
      ? 0
      : label.includes(needle)
        ? 1
        : alt.includes(needle)
          ? 2
          : detail.includes(needle)
            ? 3
            : -1;
    if (score >= 0) scored.push({ hit, score });
  }
  return scored
    .sort((a, b) => a.score - b.score || a.hit.label.length - b.hit.label.length)
    .slice(0, limit)
    .map((s) => s.hit);
}
