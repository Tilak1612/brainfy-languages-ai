# Accessibility Audit — WCAG 2.1 AA

Contrast ratios computed with the WCAG relative-luminance formula, not estimated.

## Fixed

| Issue | Was | Now |
|---|---|---|
| `--color-muted` on cream | **3.08:1** — fails AA | `#6b6862` = **4.83:1** ✅ |
| Same token on white | 3.54:1 | **5.55:1** ✅ |
| 42 hardcoded `#8b887f` literals | bypassed the token | replaced across 10 files |
| `prefers-reduced-motion` | **no support at all** | honoured globally |
| `:focus-visible` | none; UA ring invisible on dark panels | 2px brand ring, white on dark |
| Back buttons (Lesson, Review) | announced as "button" | `aria-label` |
| Answer feedback | silent | `role="alert"` |
| Sign-in errors/notices | silent | `role="alert"` / `role="status"` |
| Missing `h1` (Lesson, Review) | orphaned `h2`/`div` | real `h1` |
| Revealed translation | silent | `role="status"` |

## Open

| # | Severity | Issue |
|---|---|---|
| 1 | **P1** | Voice transcript has no `aria-live` — the core feature is silent to screen readers. Needs care: per-token streaming would machine-gun announcements, so only completed messages should be announced. |
| 2 | **P1** | Search is a combobox in behaviour with no combobox semantics (`role`, `aria-expanded`, `aria-activedescendant`). |
| 3 | **P1** | Popovers (bell, profile) have no Escape handler and no focus return. |
| 4 | **P1** | Word-bank buttons swap to `<span>` on click, destroying focus and throwing the user to the top of the tab order. |
| 5 | **P1** | Icon-only call controls use `title` as the sole accessible name. |
| 6 | **P2** | No `<nav>` landmark, no skip link, no `aria-current` on nav. |
| 7 | **P2** | Screen changes are unannounced and don't move focus. |
| 8 | **P2** | `.grad-brand` white-on-`#7c6cf6` = 3.94:1 for button text. |

## Verified clean

No `<div onClick>` anywhere — every control is a real button/input. `<html lang>`
present. No focus traps. Sidebar dark-mode greys all pass (5.29–8.89:1).
