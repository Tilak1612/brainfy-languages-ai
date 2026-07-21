#!/usr/bin/env node
// Draft learning content with Claude, validate it, and stage it for review.
//
// Two-phase on purpose. `draft` writes JSON to disk and touches nothing live;
// `apply` inserts a reviewed file. Generated language exercises are wrong often
// enough — a distractor that is actually a valid answer, an IPA transcription
// that does not match the word — that shipping them straight to learners would
// teach mistakes. A human reads the file in between.
//
//   node scripts/generate-content.mjs draft --unit travel --title "Getting Around" \
//        --cefr A2 --lessons 12 --vocab 20
//   node scripts/generate-content.mjs apply content-drafts/travel.json
//   node scripts/generate-content.mjs apply content-drafts/travel.json --publish
//
// Needs ANTHROPIC_API_KEY to draft; SUPABASE_SERVICE_ROLE_KEY (+ VITE_SUPABASE_URL)
// to apply. Both are read from the environment — never pass them as flags,
// which would put them in your shell history.
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const SKILLS = ["speaking", "listening", "vocabulary", "grammar", "reading"];
const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"];
const OUT_DIR = "content-drafts";

// ---------------------------------------------------------------- validation
// Mirrors the CHECK constraints on lang_lesson_items, so problems surface here
// with a readable message instead of as a Postgres error at insert time.
function validate(draft) {
  const errs = [];
  const seen = new Set();

  if (!draft.unit?.id) errs.push("unit.id is required");
  if (!CEFR.includes(draft.unit?.cefr)) errs.push(`unit.cefr must be one of ${CEFR}`);

  for (const [i, l] of (draft.lessons ?? []).entries()) {
    const at = `lessons[${i}] (${l.id ?? "no id"})`;
    if (!l.id) errs.push(`${at}: missing id`);
    if (seen.has(l.id)) errs.push(`${at}: duplicate id`);
    seen.add(l.id);
    if (!SKILLS.includes(l.skill)) errs.push(`${at}: skill must be one of ${SKILLS}`);
    if (!Array.isArray(l.answer) || l.answer.length < 2) errs.push(`${at}: answer needs >= 2 tokens`);
    if (!Array.isArray(l.bank)) errs.push(`${at}: bank must be an array`);

    if (Array.isArray(l.answer) && Array.isArray(l.bank)) {
      const missing = l.answer.filter((t) => !l.bank.includes(t));
      if (missing.length) errs.push(`${at}: answer tokens missing from bank: ${missing.join(", ")}`);
      if (l.bank.length <= l.answer.length) errs.push(`${at}: bank has no distractors`);
      // A distractor that merely repeats an answer token adds no difficulty.
      const extras = l.bank.filter((t) => !l.answer.includes(t));
      if (extras.length < 2) errs.push(`${at}: needs >= 2 real distractors`);
    }
  }

  for (const [i, v] of (draft.vocab ?? []).entries()) {
    const at = `vocab[${i}] (${v.id ?? "no id"})`;
    if (!v.id) errs.push(`${at}: missing id`);
    if (seen.has(v.id)) errs.push(`${at}: duplicate id`);
    seen.add(v.id);
    if (!v.term || !v.translation) errs.push(`${at}: term and translation are required`);
    if (v.ipa && !/^\/.*\/$/.test(v.ipa)) errs.push(`${at}: ipa should be wrapped in slashes`);
  }

  return errs;
}

// ------------------------------------------------------------------- drafting
const SCHEMA = {
  type: "object",
  properties: {
    unit: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        cefr: { type: "string", enum: CEFR },
      },
      required: ["id", "title", "description", "cefr"],
      additionalProperties: false,
    },
    lessons: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          prompt: { type: "string", description: "The Spanish source sentence" },
          hint: { type: "string" },
          answer: {
            type: "array",
            items: { type: "string" },
            description: "Correct English translation split into ordered tokens",
          },
          bank: {
            type: "array",
            items: { type: "string" },
            description: "Every answer token plus 2-4 plausible distractors",
          },
          skill: { type: "string", enum: SKILLS },
        },
        required: ["id", "prompt", "hint", "answer", "bank", "skill"],
        additionalProperties: false,
      },
    },
    vocab: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          term: { type: "string", description: "Spanish word or short phrase" },
          translation: { type: "string", description: "English meaning" },
          ipa: { type: "string", description: "IPA for the SPANISH term, in slashes" },
          cefr: { type: "string", enum: CEFR },
        },
        required: ["id", "term", "translation", "ipa", "cefr"],
        additionalProperties: false,
      },
    },
  },
  required: ["unit", "lessons", "vocab"],
  additionalProperties: false,
};

function prompt(o) {
  return `Write a themed unit for a Spanish-to-English learning app. The learner is a Spanish speaker learning English.

Unit id: ${o.unit}
Theme: ${o.title}
CEFR level: ${o.cefr}
Produce exactly ${o.lessons} sentence-builder lessons and ${o.vocab} vocabulary cards.

Sentence-builder rules:
- "prompt" is natural Spanish a real speaker would say in this situation.
- "answer" is the correct English translation split into tokens. Multi-word units
  that behave as one chunk stay together as a single token (e.g. "would like").
- "bank" contains every answer token PLUS 2-4 distractors.
- Distractors must be plausible but WRONG in this sentence. Never include a
  distractor that would also produce a correct translation — the exercise has a
  single right answer.
- Prefix every lesson id with "${o.unit}_l" and every vocab id with "${o.unit}_v".
- Spread the "skill" values across grammar, vocabulary and speaking.

Vocabulary rules:
- "term" is Spanish, "translation" is English.
- "ipa" transcribes the SPANISH term (not the English), wrapped in slashes.
  Use Latin American Spanish. If you are unsure of a transcription, choose a
  simpler word you are confident about rather than guessing.
- Keep vocabulary genuinely useful for the theme, not padding.

Everything must be appropriate for ${o.cefr}.`;
}

async function draft(o) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  const client = new Anthropic({ apiKey: key });

  console.log(`Drafting "${o.title}" (${o.cefr}) — ${o.lessons} lessons, ${o.vocab} vocab…`);
  const res = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content: prompt(o) }],
  });

  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const parsed = JSON.parse(text);

  const errs = validate(parsed);
  if (errs.length) {
    console.error(`\n✗ ${errs.length} validation problem(s):`);
    for (const e of errs) console.error("  - " + e);
    console.error("\nNot written. Re-run to draft again.");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${o.unit}.json`);
  fs.writeFileSync(file, JSON.stringify(parsed, null, 2));

  console.log(`\n✓ ${parsed.lessons.length} lessons, ${parsed.vocab.length} vocab — validated`);
  console.log(`  Written to ${file}`);
  console.log(`\n  REVIEW IT, then: node scripts/generate-content.mjs apply ${file} --publish`);
}

// -------------------------------------------------------------------- applying
async function apply(file, publish, checkOnly) {
  // Validate BEFORE looking at credentials, so a reviewer can check a draft
  // without holding the service-role key — and so a broken file fails with a
  // readable list rather than a missing-env error.
  const d = JSON.parse(fs.readFileSync(file, "utf8"));
  const errs = validate(d);
  if (errs.length) {
    console.error(`✗ ${file} failed validation — refusing to insert:`);
    for (const e of errs) console.error("  - " + e);
    process.exit(1);
  }
  console.log(`✓ ${file} is valid: ${d.lessons.length} lessons, ${d.vocab.length} vocab`);
  if (checkOnly) return;

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");

  const db = createClient(url, key, { auth: { persistSession: false } });

  let r = await db.from("lang_units").upsert({
    id: d.unit.id,
    title: d.unit.title,
    description: d.unit.description,
    cefr: d.unit.cefr,
    // Unpublished by default: inserting content and revealing it to learners
    // are separate decisions.
    published: Boolean(publish),
  });
  if (r.error) throw r.error;

  r = await db.from("lang_lesson_items").upsert(
    d.lessons.map((l, i) => ({ ...l, unit_id: d.unit.id, cefr: d.unit.cefr, sort_order: i + 1 })),
  );
  if (r.error) throw r.error;

  r = await db.from("lang_vocab").upsert(
    d.vocab.map((v, i) => ({ ...v, unit_id: d.unit.id, sort_order: i + 1 })),
  );
  if (r.error) throw r.error;

  console.log(`✓ Applied "${d.unit.title}": ${d.lessons.length} lessons, ${d.vocab.length} vocab`);
  console.log(publish ? "  Published — live for learners." : "  Staged UNPUBLISHED (re-run with --publish to reveal).");
}

// ----------------------------------------------------------------------- cli
const [cmd, ...rest] = process.argv.slice(2);
const flag = (n, dflt) => {
  const i = rest.indexOf("--" + n);
  return i >= 0 && rest[i + 1] && !rest[i + 1].startsWith("--") ? rest[i + 1] : dflt;
};

if (cmd === "draft") {
  const unit = flag("unit");
  if (!unit) {
    console.error("--unit is required");
    process.exit(1);
  }
  await draft({
    unit,
    title: flag("title", unit),
    cefr: flag("cefr", "A2"),
    lessons: Number(flag("lessons", 10)),
    vocab: Number(flag("vocab", 15)),
  });
} else if (cmd === "apply") {
  const file = rest.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("usage: apply <file.json> [--publish]");
    process.exit(1);
  }
  await apply(file, rest.includes("--publish"), rest.includes("--check"));
} else {
  console.log(`usage:
  generate-content.mjs draft --unit <id> [--title T] [--cefr A2] [--lessons 10] [--vocab 15]
  generate-content.mjs apply <file.json> [--check] [--publish]

  --check    validate only; no credentials needed, nothing written
  --publish  make the unit visible to learners (default: staged unpublished)`);
}
