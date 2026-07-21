# Roadmap

Sized against the stated goal of competing with Duolingo/Babbel/Speak.

## P0 — blocks any public launch

| # | Item | Effort | Why |
|---|---|---|---|
| P0-1 | **Mobile layout** | 1–2 wk | Zero breakpoints exist. 264px sidebar on a 375px screen; `grid-cols-4` cannot reflow. Consumer language learning is majority mobile — this is disqualifying. |
| P0-2 | **Router + URLs** | 3–5 d | No back button, no deep links, no shareable pages, no per-screen analytics. Structural; everything else builds on it. |
| P0-3 | **Content to ≥10 hours** | 4–8 wk | 20 minutes today. A subscriber exhausts it before the trial ends. Pipeline exists (`scripts/generate-content.mjs`); this is authoring + review time. |
| P0-4 | **Onboarding + placement** | 1 wk | New users land on a dashboard with no explanation and a level they never set. |
| P0-5 | **Meter TTS/STT** | 1 d | Authenticated but unlimited; the flank the chat quota doesn't cover. |
| P0-6 | **Live Stripe migration** | 1 d | Everything is sandbox. |

## P1 — needed to retain and measure

| # | Item | Effort |
|---|---|---|
| P1-1 | Analytics (signup, lesson, conversation, subscription, retention) | 3 d |
| P1-2 | Fix remaining honesty gaps (mastery from real correctness, real elapsed time, tutor-memory claim) | 2 d |
| P1-3 | Voice transcript `aria-live` + popover focus management | 3 d |
| P1-4 | E2E tests for signup → lesson → conversation → subscribe | 1 wk |
| P1-5 | Settings screen (daily goal, reduce motion, delete account) | 3 d |
| P1-6 | Transactional email (Resend): welcome, streak, trial ending | 3 d |
| P1-7 | True pronunciation scoring (Azure/Speechace) | 1 wk + vendor |
| P1-8 | Commit schema/RLS migrations to the repo | 1 d |

## P2 — competitive parity

Learning path/map · Achievements page · Writing exercises with correction ·
Listening exercises · Reading with inline glossary · Quizzes · Streak freeze ·
Weekly goals · Weak-topic detection · CI pipeline.

## P3 — differentiation

Leaderboards (needs a social model) · Certificates · IELTS/TOEFL/CELPIP prep
(needs licensed material and subject-matter review) · Teacher/admin roles ·
Second language pair · Native mobile apps.

## Sequencing

```
Now ──► P0-5, P0-6 (1 day, unblocks charging safely)
    ──► P0-2 router ──► P0-1 mobile ──► P0-4 onboarding
    ──► P0-3 content (runs in parallel, longest pole)
    ──► P1-1 analytics (needs the router)
```

## What this product should actually be

The brief asks for a Duolingo competitor. That is a multi-year content
investment — Duolingo has ~40 languages × ~100 units; this has 1 × 2.

**The AI tutor already beats most named competitors.** Claude with well-built
personas, real speech I/O, and genuine error correction is a better conversation
partner than Duolingo's scripted bots or Babbel's recordings. The defensible
strategy is to be *the best AI conversation tutor*, not a worse Duolingo — that
reframes P0-3 from "10 hours of curriculum" to "enough scaffolding around
conversation to justify a subscription", which is a far shorter path.
