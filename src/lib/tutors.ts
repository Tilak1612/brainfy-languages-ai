// Active-tutor selection. Picking a tutor on the Tutors screen decides who you
// actually talk to in the Voice screen — the persona drives the system prompt,
// the header and the session badge.
import { useSyncExternalStore } from "react";
import { tutors, type Tutor } from "../data";

export interface Persona extends Tutor {
  id: string;
  /** Session badge, e.g. "Free conversation · B2". */
  badge: string;
  custom?: boolean;
  /**
   * The four form fields for a user-built tutor. Sent to the server, which
   * assembles the prompt from a fixed template — the client never composes or
   * transmits prompt prose, so a "personality" cannot smuggle in instructions.
   */
  customFields?: { name: string; focus: string; personality: string; accent: string };
}

// Prompts live SERVER-SIDE in api/_personas.ts. Keeping a copy here would be a
// second source of truth that silently drifts, and historically the client copy
// was the one actually sent — which let anyone replace it. The client now knows
// only display metadata; the server maps id -> prompt.
const BADGES: Record<string, string> = {
  Maya: "Free conversation · B2",
  Kenji: "Grammar focus · B2",
  "Léo": "Pronunciation · B2",
  Amara: "Business & interview · B2",
};

function toPersona(t: Tutor): Persona {
  return {
    ...t,
    id: t.name,
    badge: BADGES[t.name] ?? "Conversation · B2",
  };
}

export const PERSONAS: Persona[] = tutors.map(toPersona);

/** Build a persona from the custom-tutor form. */
export function buildCustom(opts: {
  name: string;
  focus: string;
  personality: string;
  accent: string;
}): Persona {
  const name = opts.name.trim() || "Custom tutor";
  return {
    id: "custom:" + name.toLowerCase(),
    initials: name.slice(0, 2).toUpperCase(),
    name,
    role: opts.focus,
    grad: "linear-gradient(135deg,#8B7CF6,#5B4BE8)",
    blurb: `${opts.personality}. Focuses on ${opts.focus.toLowerCase()}.`,
    badge: `${opts.focus} · B2`,
    custom: true,
    customFields: { name, focus: opts.focus, personality: opts.personality, accent: opts.accent },
  };
}

// ---- store ----
const KEY = "brainfy.tutors.v1";

interface Saved {
  activeId: string;
  custom: Persona[];
}

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { activeId: "Maya", custom: [], ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { activeId: "Maya", custom: [] };
}

let saved: Saved = load();
const listeners = new Set<() => void>();

function commit(next: Saved) {
  saved = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): Saved {
  return saved;
}

/** Every tutor available to pick: the built-ins plus any the user built. */
export function allPersonas(): Persona[] {
  return [...PERSONAS, ...saved.custom];
}

export function setActive(id: string) {
  commit({ ...saved, activeId: id });
}

export function addCustom(p: Persona) {
  const custom = [...saved.custom.filter((c) => c.id !== p.id), p];
  commit({ ...saved, custom, activeId: p.id });
}

export function removeCustom(id: string) {
  const custom = saved.custom.filter((c) => c.id !== id);
  commit({ ...saved, custom, activeId: saved.activeId === id ? "Maya" : saved.activeId });
}

/** The tutor the Voice screen should talk as. Falls back to Maya. */
export function useActiveTutor(): Persona {
  const s = useSyncExternalStore(subscribe, snapshot, snapshot);
  return allPersonas().find((p) => p.id === s.activeId) ?? PERSONAS[0];
}

export function useTutors(): { active: string; custom: Persona[] } {
  const s = useSyncExternalStore(subscribe, snapshot, snapshot);
  return { active: s.activeId, custom: s.custom };
}
