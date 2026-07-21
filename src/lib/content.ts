// Loads learning content from Postgres, falling back to the bundled content.
//
// The static arrays in src/content/learning.ts remain the demo-mode source and
// the offline fallback: if there is no Supabase project, or the fetch fails, the
// app still works with the original 5 lessons and 12 cards rather than showing
// an empty screen.
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import {
  lessonItems as localLessons,
  vocabDeck as localVocab,
  type BuilderItem,
  type VocabCard,
} from "../content/learning";

interface LessonRow {
  id: string;
  prompt: string;
  hint: string;
  answer: string[];
  bank: string[];
  skill: BuilderItem["skill"];
}

interface VocabRow {
  id: string;
  term: string;
  translation: string;
  ipa: string;
}

export interface Content {
  lessons: BuilderItem[];
  vocab: VocabCard[];
  /** False until the remote fetch settles, so callers can avoid a content flash. */
  ready: boolean;
  /** True when showing bundled content because the database was unavailable. */
  usingFallback: boolean;
}

// Module-level cache: content is identical for every learner and never changes
// mid-session, so fetch it once rather than per component mount.
let cache: { lessons: BuilderItem[]; vocab: VocabCard[] } | null = null;
let inflight: Promise<void> | null = null;

async function load() {
  if (!supabase) return;
  const [lessonsRes, vocabRes] = await Promise.all([
    supabase
      .from("lang_lesson_items")
      .select("id, prompt, hint, answer, bank, skill")
      .order("unit_id")
      .order("sort_order"),
    supabase
      .from("lang_vocab")
      .select("id, term, translation, ipa")
      .order("unit_id")
      .order("sort_order"),
  ]);

  const lessons = (lessonsRes.data ?? []) as LessonRow[];
  const vocab = (vocabRes.data ?? []) as VocabRow[];
  // An empty result means unpublished or unreachable content — keep the
  // bundled set rather than dropping the learner into an empty app.
  if (!lessons.length || !vocab.length) return;

  cache = {
    lessons: lessons.map((l) => ({
      id: l.id,
      prompt: l.prompt,
      hint: l.hint,
      answer: l.answer,
      bank: l.bank,
      skill: l.skill,
    })),
    vocab: vocab.map((v) => ({
      id: v.id,
      term: v.term,
      translation: v.translation,
      ipa: v.ipa,
    })),
  };
}

export function useContent(): Content {
  const [, bump] = useState(0);
  const [ready, setReady] = useState(!supabase || Boolean(cache));

  useEffect(() => {
    if (!supabase || cache) return;
    inflight ??= load().catch(() => {
      /* keep the fallback */
    });
    let active = true;
    void inflight.then(() => {
      if (!active) return;
      setReady(true);
      bump((n) => n + 1);
    });
    return () => {
      active = false;
    };
  }, []);

  return {
    lessons: cache?.lessons ?? localLessons,
    vocab: cache?.vocab ?? localVocab,
    ready,
    usingFallback: !cache,
  };
}
