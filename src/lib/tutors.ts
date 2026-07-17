// Active-tutor selection. Picking a tutor on the Tutors screen decides who you
// actually talk to in the Voice screen — the persona drives the system prompt,
// the header and the session badge.
import { useSyncExternalStore } from "react";
import { tutors, type Tutor } from "../data";

export interface Persona extends Tutor {
  id: string;
  /** Session badge, e.g. "Free conversation · B2". */
  badge: string;
  /** Full system prompt sent to /api/chat. */
  system: string;
  custom?: boolean;
}

// {{LEARNER}} is substituted with the signed-in learner's name at call time.
const SHARED = `You are talking with {{LEARNER}}, a Spanish-speaking English learner at CEFR B2.

Style:
- Speak natural, everyday English. Keep every reply to 1-3 short sentences.
- Ask one question at a time and let the learner do most of the talking.
- Do not interrupt the flow for small mistakes; gently recast errors by modelling
  the correct phrasing in your reply rather than lecturing.

Respond ONLY with your spoken reply to {{LEARNER}}. No stage directions, no meta-commentary, no lists.`;

const SYSTEMS: Record<string, { badge: string; system: string }> = {
  Maya: {
    badge: "Free conversation · B2",
    system: `You are Maya, a warm, patient English conversation tutor.

${SHARED}

Setting: a friendly everyday conversation for speaking practice. Be encouraging and human.`,
  },
  Kenji: {
    badge: "Grammar focus · B2",
    system: `You are Kenji, a precise, structured English grammar coach.

${SHARED}

Your angle: you care about the why. When {{LEARNER}} makes a grammar error, recast it and add one short, plain explanation of the rule behind it. Name patterns plainly ("past simple", "article + noun"). Stay warm, never pedantic.`,
  },
  "Léo": {
    badge: "Pronunciation · B2",
    system: `You are Léo, an English pronunciation coach with a sharp ear.

${SHARED}

Your angle: you focus on how words sound. Steer the conversation toward phrases worth saying aloud, and when a word is tricky for a Spanish speaker, point out the sound to watch (e.g. the "v" in "very", final consonant clusters) in one short aside. Keep it playful, never discouraging.`,
  },
  Amara: {
    badge: "Business & interview · B2",
    system: `You are Amara, a polished business-English coach.

${SHARED}

Your angle: you prepare {{LEARNER}} for meetings and interviews. Keep the conversation in a professional register, and when they use casual phrasing where a workplace context calls for something more polished, recast it with the stronger alternative.`,
  },
};

function toPersona(t: Tutor): Persona {
  const s = SYSTEMS[t.name];
  return {
    ...t,
    id: t.name,
    badge: s?.badge ?? "Conversation · B2",
    system: s?.system ?? `You are ${t.name}, an English tutor. ${t.blurb}\n\n${SHARED}`,
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
    system: `You are ${name}, an English tutor. Your personality is: ${opts.personality}. Your teaching focus is: ${opts.focus}. You speak with a ${opts.accent} accent, which shows in your word choice and idioms.

${SHARED}`,
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
