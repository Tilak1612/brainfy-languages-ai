// URL <-> Screen mapping.
//
// The app used to hold `screen` in React state with no URL at all, which meant
// no deep links, no back button, and — because Vercel had nothing to serve for
// an unknown path — the raw platform 404 with the hosting provider's name on it.
//
// This is deliberately not react-router. The app has one flat level of
// navigation and a single `Screen` union that every component already threads
// around; a router would add a dependency and a second source of truth for the
// same value. The History API is enough.
import type { Screen } from "../data";

export const SCREEN_PATHS: Record<Screen, string> = {
  dashboard: "/",
  voice: "/tutor",
  lesson: "/lessons",
  review: "/review",
  pron: "/pronunciation",
  progress: "/progress",
  tutors: "/tutors",
};

const BY_PATH = new Map<string, Screen>(
  (Object.entries(SCREEN_PATHS) as [Screen, string][]).map(([s, p]) => [p, s]),
);

/** The screen for a pathname, or null if nothing matches (render the 404). */
export function screenFromPath(pathname: string): Screen | null {
  // Tolerate a trailing slash so /progress/ is not a 404, but keep "/" itself.
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return BY_PATH.get(p || "/") ?? null;
}

export function pathForScreen(s: Screen): string {
  return SCREEN_PATHS[s];
}

// Per-route title and description. Without these every route shared one title,
// so browser history and tab strips were unreadable and a shared link said
// nothing about where it pointed.
interface Meta {
  title: string;
  description: string;
}

const SITE = "Brainfy Languages AI";

export const SCREEN_META: Record<Screen, Meta> = {
  dashboard: {
    title: SITE,
    description:
      "Practice Spanish to English with an AI tutor that talks back. Real conversation, spaced-repetition review, and pronunciation feedback.",
  },
  voice: {
    title: `Voice Tutor · ${SITE}`,
    description:
      "Hold a real spoken conversation with an AI tutor. Speak, get corrected, and build fluency instead of streaks.",
  },
  lesson: {
    title: `Lessons · ${SITE}`,
    description:
      "Themed sentence-builder lessons from A1 to B1 — cafés, travel, work, health, plans and more.",
  },
  review: {
    title: `Review · ${SITE}`,
    description:
      "Spaced-repetition review that resurfaces each word right before you would have forgotten it.",
  },
  pron: {
    title: `Pronunciation · ${SITE}`,
    description:
      "Record yourself, see which words were actually recognised, and work on the ones that were not.",
  },
  progress: {
    title: `Progress · ${SITE}`,
    description:
      "Your real streak, XP, skill mastery and weekly practice minutes — measured, not decorative.",
  },
  tutors: {
    title: `AI Tutors · ${SITE}`,
    description:
      "Pick a tutor with their own voice, pace and personality, or describe your own and practice with it.",
  },
};

export const NOT_FOUND_META: Meta = {
  title: `Page not found · ${SITE}`,
  description: "That page does not exist.",
};

/** Writes title + description into the document head for the current route. */
export function applyMeta(m: Meta) {
  document.title = m.title;
  let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = "description";
    document.head.appendChild(tag);
  }
  tag.content = m.description;
}
