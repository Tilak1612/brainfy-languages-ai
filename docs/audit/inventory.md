# Inventory

## Screens: 8 exist, ~35 requested

| Exists | Screen | State |
|---|---|---|
| ✅ | Sign in / Sign up | Working; errors now announced |
| ✅ | Dashboard | Working; fabricated resume-card removed |
| ✅ | Voice Tutor | Best screen; live AI + speech I/O |
| ✅ | Lessons (sentence builder) | Working; DB-backed |
| ✅ | Review (SRS) | Working; SM-2, tested |
| ✅ | Speaking practice | Rewritten — was fabricated |
| ✅ | Progress | Working; week chart now real |
| ✅ | AI Tutors | Working; custom tutors persist |

**Requested but absent (27):** Homepage/marketing, Forgot password, Onboarding,
Language selection, Learning path, Grammar, Reading, Listening, Writing,
Flashcards, Quizzes, Achievements page, XP page, Leaderboard, Daily goals,
Calendar, Certificates, Settings, Notifications centre, Subscription page,
Billing page, Admin, Teacher, Student mgmt, Analytics, Help, Profile.

Note: Billing exists as *flows* (checkout + Stripe portal), not as in-app pages.

## Routes

**There are none.** Navigation is `useState<Screen>` in `App.tsx`. Consequences:
no URLs, no browser back, no deep links, no bookmarks, no shareable pages, and
no per-screen analytics. This is a structural P0.

## API surface

| Endpoint | Auth | Quota | Notes |
|---|---|---|---|
| `POST /api/chat` | ✅ required | ✅ free 10/day, pro 40/hr | Persona resolved server-side |
| `POST /api/tts` | ✅ required | ❌ **none** | P1 — unmetered |
| `POST /api/stt` | ✅ required | ❌ **none** | P1 — unmetered |
| `POST /api/checkout` | ✅ required | n/a | Plan name → server-held price ID |
| `POST /api/portal` | ✅ required | n/a | Customer from our record, not the body |
| `POST /api/stripe-webhook` | signature | n/a | Verified before any other check |
| `GET /api/health` | public | n/a | Capability flags only |

## Database (Supabase `brainfy-languages-prod`)

| Table | RLS | Notes |
|---|---|---|
| `lang_profiles` | owner-only | Seeded by signup trigger |
| `lang_progress` | owner-only | + `conversations`, `daily_minutes` |
| `lang_srs_cards` | owner-only | Indexed on (user_id, due_ts) |
| `lang_custom_tutors` | owner-only | |
| `lang_settings` | owner-only | |
| `lang_subscriptions` | **read-only** | Writes via webhook service role only |
| `lang_api_usage` | insert+select | No delete — quota is tamper-proof |
| `lang_units` / `lang_lesson_items` / `lang_vocab` / `lang_conv_steps` | read published | CHECK constraints enforce solvability |

Verified by probe: a learner sees only their own rows, cannot write
`lang_subscriptions`, cannot delete `lang_api_usage`, cannot edit content.

## Content

| Type | Count |
|---|---|
| Language pairs | 1 (Spanish → English) |
| Units | 2 |
| Sentence-builder exercises | 15 |
| Vocabulary cards | 27 |
| Conversation scripts | 1 |

≈20 minutes of material.

## Tooling

| | Before | After |
|---|---|---|
| Test runner | none | Vitest |
| Tests | 0 | 12 |
| Linter | oxlint (unconfigured) | unchanged |
| E2E | none | none |
| Typecheck | `tsc --noEmit` **checked nothing** (root has `files: []`) | use `tsc -b` |
| CI | none | none |
