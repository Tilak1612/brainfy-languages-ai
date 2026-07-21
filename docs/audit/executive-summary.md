# Executive Audit

## Verdict

**Not production-ready as a consumer language-learning SaaS.** It is a
production-*quality* prototype of a narrow slice of one.

The distinction matters. The infrastructure — auth, payments, AI, voice,
persistence, RLS — is real, tested against live services, and now defensible.
What is missing is the product: content, breadth of screens, and mobile support.
No amount of engineering polish closes that; it requires authoring and design.

## What genuinely works

Verified end to end against live services, not assumed:

| Capability | Evidence |
|---|---|
| AI tutor conversation | Live Claude call; recasts errors correctly ("I go" → "you went") |
| 4 tutor personas + custom | Distinct behaviour proven: Maya recasts silently, Kenji names the rule |
| Text-to-speech | Returns valid 16-bit mono WAV from NVIDIA Riva |
| Speech-to-text | Round-trip transcription verified at 200 |
| Spaced repetition | SM-2 scheduler, 9 unit tests, cards persist and re-schedule |
| Accounts | Signup → trigger seeds rows → progress syncs → survives reload |
| Subscriptions | Stripe checkout → webhook → DB row → entitlement gate flips |
| Row-level security | Users provably cannot read or write other users' data |

## What is fabricated, missing, or broken

### Fixed during this audit

1. **CRITICAL — the app was a free Claude proxy.** `/api/chat` accepted an
   arbitrary `system` prompt from the browser. Any account could replace the
   tutor persona with anything; policy violations would be attributed to this
   Anthropic account. Prompts now live server-side and the client sends only an ID.
2. **HIGH — auth failed open.** If the Supabase env vars were absent at runtime,
   authentication *and* the quota were skipped entirely, exposing both API keys.
   Now fails closed behind an explicit opt-in.
3. **HIGH — no payload limits.** A single ~4 MB request was ~1M input tokens,
   making the per-request quota meaningless as a cost control.
4. **CRITICAL (integrity) — the pronunciation screen was entirely invented.**
   Fixed phoneme scores rendered before any recording existed; "Record again"
   called `Math.random()` rigged so weak sounds always improved; the score was
   the literal constant 83. Worst of all it wrote **real XP, real skill mastery
   and real streak activity** from that fiction into Postgres. Rewritten to
   record, transcribe, and compare against the target — a real signal.
5. **Fake progress.** "185 minutes · +12% vs last week" (no history was stored),
   a fixed 7-bar week chart, "68% · 6 min left" on a card whose button restarted
   from item 1, and a hardcoded "B2" CEFR level for every account including
   brand-new ones. All now derived or removed.
6. **3 of 6 achievements were unwinnable** — tiles existed with no unlock rule.
7. **Crash and NaN paths.** A null column rendered `NaN%`; a null skills object
   white-screened the entire app with no error boundary.

### Known and unfixed

| Gap | Severity | Why not fixed here |
|---|---|---|
| **No mobile layout** | **P0** | Zero responsive breakpoints in 4,350 lines; 264px fixed sidebar on a 375px screen. Needs a design pass, not a patch. |
| **No router** | **P0** | State-switch navigation: no URLs, no back button, no deep links, no shareable pages. Structural. |
| **~27 named screens don't exist** | **P0** | Brief lists ~35; 8 exist. Onboarding, leaderboard, certificates, admin, writing, reading, listening — all absent. |
| **Voice/STT endpoints unmetered** | **P1** | Authenticated but no quota; one account can loop TTS indefinitely. |
| **No analytics** | **P1** | Zero event tracking. Retention/churn are unmeasurable. |
| **~20 minutes of content** | **P0** | 15 lessons, 27 vocab, 1 language pair. |
| **No E2E tests** | **P1** | 12 unit tests exist; no browser-level coverage. |
| **Pronunciation is word-level** | **P1** | True phoneme scoring needs a vendor (Azure/Speechace). |

## The honest competitive position

The brief names Duolingo, Babbel, Busuu, and seven others. Concretely:

- Duolingo: ~40 languages, ~100 units each, tens of thousands of exercises.
- This app: **1 language pair, 2 units, 15 exercises.**

The AI tutor is genuinely competitive — arguably better than most named
competitors, because it's Claude with well-constructed personas. **That is the
product's actual differentiator and the thing worth building around.** Competing
on breadth of curriculum is a multi-year content investment; competing on
conversation quality is winnable now.

## Recommendation

1. **Do not launch publicly.** No mobile layout is disqualifying for consumer.
2. **Reposition around the tutor.** Ship the conversation experience, not a
   Duolingo clone. It is the one part that already beats the competition.
3. **Order of work:** mobile → router → content → analytics → breadth.
4. **Two commercial unknowns remain open:** the NVIDIA Riva rate (unit economics
   are unverifiable without it) and live-mode Stripe migration.
