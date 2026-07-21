# Brainfy Languages AI — Audit

Audited against the production deployment and this repository. Every finding
below is traceable to a file:line or a reproduced observation; nothing is
inferred from the design.

| Document | Contents |
|---|---|
| [`executive-summary.md`](./executive-summary.md) | What this product is today, honestly |
| [`inventory.md`](./inventory.md) | Screens, routes, components, APIs, tables |
| [`security.md`](./security.md) | OWASP audit + what was fixed |
| [`accessibility.md`](./accessibility.md) | WCAG 2.1 AA audit with measured contrast |
| [`data-integrity.md`](./data-integrity.md) | Fabricated data audit |
| [`roadmap.md`](./roadmap.md) | P0–P3, sized against the competitive brief |

## The one-paragraph version

Brainfy Languages AI is a **working single-language (Spanish→English) tutor
prototype** with genuinely functional AI conversation, speech I/O, spaced
repetition, accounts, and subscriptions. It is **not** a competitor to Duolingo
or Babbel today: it has 8 screens against their hundreds, 2 units of content
(~20 minutes), no mobile layout, no router, and no analytics. The engineering
foundation is sound and the security posture is now defensible. The gap to the
stated goal is **content and breadth**, not infrastructure — and that gap is
measured in months of authoring, not a refactor.

## Audit method

- Three parallel code audits (security/OWASP, WCAG 2.1 AA, data honesty), each
  required to cite file:line and forbidden from speculating.
- Live probing of the deployed API surface (auth, quota, webhook signature).
- Direct database probing under RLS, impersonating a learner via JWT claims.
- Browser measurement for layout and contrast rather than visual estimation.

## Status at time of writing

Fixed this pass: 1 critical security hole, 2 high, all NaN/crash paths, the
fabricated pronunciation screen, the fake week chart, hardcoded CEFR level,
3 unwinnable achievements, WCAG contrast token, reduced-motion, focus-visible,
missing headings and labels. Test infrastructure added (12 tests, was 0).

Not fixed, and honestly out of scope for one pass: mobile layout, routing,
~27 screens named in the brief that do not exist, analytics, E2E tests.
