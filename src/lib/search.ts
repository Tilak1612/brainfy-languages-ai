// Search index for the topbar. Everything a user can reach from the search
// field is registered here, so results always point at a real destination.
import type { Screen } from "../data";
import { tutors } from "../data";
import { lessonItems, vocabDeck } from "../content/learning";

export interface Hit {
  kind: "Lesson" | "Tutor" | "Word" | "Page";
  label: string;
  detail: string;
  screen: Screen;
}

const PAGES: Hit[] = [
  { kind: "Page", label: "Voice Tutor", detail: "Live conversation with Maya", screen: "voice" },
  { kind: "Page", label: "Lessons", detail: "Sentence builder practice", screen: "lesson" },
  { kind: "Page", label: "Review", detail: "Spaced repetition drill", screen: "review" },
  { kind: "Page", label: "Pronunciation", detail: "Phoneme-level feedback", screen: "pron" },
  { kind: "Page", label: "Progress", detail: "Streak, XP and skill mastery", screen: "progress" },
  { kind: "Page", label: "AI Tutors", detail: "Browse every tutor", screen: "tutors" },
];

function index(): Hit[] {
  const tutorHits: Hit[] = tutors.map((t) => ({
    kind: "Tutor",
    label: t.name,
    detail: `${t.role} — ${t.blurb}`,
    screen: "tutors",
  }));

  const lessonHits: Hit[] = lessonItems.map((l) => ({
    kind: "Lesson",
    label: l.answer.join(" "),
    detail: `Sentence builder · ${l.skill}`,
    screen: "lesson",
  }));

  const wordHits: Hit[] = vocabDeck.map((c) => ({
    kind: "Word",
    label: c.term,
    detail: `${c.translation} · ${c.ipa}`,
    screen: "review",
  }));

  return [...PAGES, ...tutorHits, ...lessonHits, ...wordHits];
}

const ALL = index();

/** Case-insensitive substring match across label and detail, best matches first. */
export function search(q: string, limit = 8): Hit[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  const scored: Array<{ hit: Hit; score: number }> = [];
  for (const hit of ALL) {
    const label = hit.label.toLowerCase();
    const detail = hit.detail.toLowerCase();
    // Prefer a label prefix, then a label hit, then anything in the detail.
    const score = label.startsWith(needle) ? 0 : label.includes(needle) ? 1 : detail.includes(needle) ? 2 : -1;
    if (score >= 0) scored.push({ hit, score });
  }
  return scored
    .sort((a, b) => a.score - b.score || a.hit.label.length - b.hit.label.length)
    .slice(0, limit)
    .map((s) => s.hit);
}
