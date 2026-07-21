# Data Integrity Audit

Rule applied: a number is **fabricated** if a user would reasonably believe it
describes their own learning and it does not.

## Fixed

| Location | Showed | Truth |
|---|---|---|
| `Pronunciation.tsx` | Phoneme scores, "83%", "Better than 71% of learners" | Fixed array + `Math.random()`, rigged to always improve. **Wrote real XP/mastery/streak from fiction.** Rewritten to record → transcribe → compare. |
| `Dashboard.tsx` | "Unit 4 · 6 min left", 68% bar | Constants. "Resume" restarted at item 1. Replaced with a real exercise count. |
| `Progress.tsx` | "185 minutes · +12% vs last week" | No history was stored; uncomputable. Now derived from real per-day data, hidden when there's no baseline. |
| `Progress.tsx` | 7-bar week chart | Fixed heights, never changed. Now real, with an empty state. |
| `Progress.tsx` / `Sidebar.tsx` | "CEFR level: B2" | Hardcoded for everyone, including zero-mastery accounts. Now derived from mastery, labelled as a proxy. |
| `Progress.tsx` | "N of 6 unlocked" | 3 tiles had no unlock rule — permanently unwinnable. All 6 now have rules. |
| `sync.ts` | — | Unguarded hydrate rendered `NaN%` and crashed Progress. All fields coerced; types made honestly nullable. |
| `App.tsx` | — | No error boundary; one render error blanked the app. Added per-screen. |

## Open

| # | Severity | Issue |
|---|---|---|
| 1 | **P1** | Every AI turn calls `recordAnswer("speaking", true)` — typing gibberish raises Speaking mastery. |
| 2 | **P1** | Each chat message adds 1 minute to `minutesToday` regardless of real elapsed time, while a real clock runs unused. |
| 3 | **P1** | Tutors screen claims "persistent memory means they remember every session" — false; history resets on mount. |
| 4 | **P2** | Scripted mode labels the transcript "Auto-corrected"; nothing is corrected. |
| 5 | **P2** | Recommended cards advertise "Adaptive · 10 min" and "Mock test · IELTS" — neither exists; all three open the same lesson. |
| 6 | **P2** | `useContent()` exposes `ready`/`usingFallback`; no screen consumes them, so bundled content renders as if it were live. |
| 7 | **P3** | Dead mock exports in `data.ts` (`skills`, `transcript`, `phonemes`). |

## Empty / loading / error state coverage

| Screen | Empty | Loading | Error |
|---|---|---|---|
| Voice | ✅ | ✅ | ✅ |
| Review | ✅ | ❌ | ❌ |
| Speaking | ✅ (new) | ✅ (new) | ✅ (new) |
| Progress | ✅ (new) | ❌ | ❌ |
| Dashboard | ❌ | ❌ | ❌ |
| Lesson | ❌ | ❌ | ⚠️ AI path only |
| Tutors | ✅ | n/a | ❌ |
