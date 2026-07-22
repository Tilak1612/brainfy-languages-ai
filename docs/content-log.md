# Content Log

Drafts live in `content-drafts/` and are **gitignored** — they are generated
artifacts. The database is the source of truth, so this file is the tracked
record of what has been published and what review caught before it shipped.

Authoring path: `scripts/generate-content.mjs draft` → human/independent review →
`apply --publish`. Nothing reaches learners without the review step.

## Published catalogue

| Unit | Title | CEFR | Lessons | Vocab |
|---|---|---|---|---|
| `cafe` | Ordering at a Café | A2 | 5 | 12 |
| `travel` | Getting Around | A2 | 10 | 15 |
| `shopping` | Shopping | A2 | 12 | 15 |
| `health` | At the Doctor | A2 | 12 | 15 |
| `work` | At Work | B1 | 12 | 15 |
| `plans` | Making Plans | A2 | 12 | 15 |
| `home` | Your Home | B1 | 12 | 15 |
| `opinions` | Small Talk & Opinions | A2 | 12 | 15 |

**Totals: 8 units · 87 lessons · 117 vocabulary cards.**

## Integrity invariants

Re-run after every publish. All must be zero:

- `multiset_violations` — an answer token repeated more often than the bank
  supplies it. The exercise is literally unsolvable. The Postgres CHECK
  (`bank @> answer`) is **set** containment and cannot catch this; only the
  script's multiset check can.
- `no_distractors` / `weak_distractors` — bank no larger than the answer, or
  fewer than two tokens that are not answer tokens.
- `bad_ipa` — transcription missing or not wrapped in slashes.
- `missing_translation`, `dup_terms`.

Last verified after the `plans`/`home`/`opinions` publish: **all zero**.

## What review caught (that validation cannot)

Structural validation checks shape, not language. Every round of independent
review has found errors that would have taught learners something wrong.

### Round 1 — `shopping`, `health`, `work`

- `Encantado … soy la nueva diseñadora` — gender concord error in the exact
  sentence meant to model it. → `Encantada`.
- Four exercises whose distractors formed a **second correct translation**, so a
  right answer would have been marked wrong.
- Peninsular `¿Te viene bien?` → Latin American `¿Te parece bien?`;
  `Sólo` → `Solo` (RAE dropped the accent in 2010).
- Mixed British/American English standardised to American.
- Three IPA errors (fricative allophones, hiatus vs diphthong, syllable break).

### Round 2 — `plans`, `home`, `opinions`

- **Register, the biggest one:** `quedar` for "meet up" is Peninsular and not
  idiomatic in Latin America. → `encontrarse`, and the prompt became
  `¿A qué hora nos vemos?`. Same class of error: `la habitación` → `el dormitorio`.
- Five ambiguous distractors that would have marked correct answers wrong
  (`home_l8` "May", `opinions_l12` "this", `plans_l3` "When",
  `opinions_l4` "really", `opinions_l10` "at home").
- British English leaks: "agree a time", "to move house", "shall".
- Five IPA corrections: `el viernes` `/el ˈβjeɾ.nes/`, `el vecino`
  `/el βeˈsi.no/`, `la verdad` `/la βeɾˈðað/`, `invitar` `/im.biˈtaɾ/`,
  `el restaurante` `/el res.tawˈɾan.te/` — all the same underlying rule
  (post-vocalic /b/ and /d/ are fricatives; /n/ assimilates before /b/).
- CEFR skew: `opinions` was drafted B1 but reads A2. Relabelled A2 with `l7`,
  `l9` and `l12` marked B1 at item level.

## Open

- **A native Latin American Spanish speaker has still not reviewed this.** The
  reviews above were model-run. They found real errors, which is evidence they
  help — not evidence they are sufficient.
- 87 lessons is roughly a few weeks of daily practice, not a year. Content
  volume remains the weakest part of the subscription value.
