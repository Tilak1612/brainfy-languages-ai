# Security Audit (OWASP)

Full-code audit plus live probing of the deployed endpoints.

## Fixed in this pass

### CRITICAL — Client-controlled system prompt
`api/chat.ts` took `system` from the request body. Any signed-in user could
replace the tutor persona with arbitrary instructions, turning the deployment
into a general-purpose Claude proxy. **The real risk is not the bill — it is
that policy violations generated this way are attributed to this Anthropic
account.** Every safety instruction was client-side and therefore advisory.

**Fixed:** prompts moved to `api/_personas.ts`. The client sends an ID; prose is
assembled server-side from constants. Custom tutors send four *fields*, each
newline-stripped and length-capped, assembled from a fixed template. Verified
the prompt text no longer appears in the client bundle.

### HIGH — Authentication failed open
When `VITE_SUPABASE_URL`/`ANON_KEY` were absent at runtime, `authenticate()`
returned `ok: true`, skipping auth **and** the quota. `VITE_` vars are build-time
by convention, so scoping one to "Build only" — a plausible cleanup — silently
exposed `ANTHROPIC_API_KEY` to the internet with no symptom but a bill.

**Fixed:** fails closed. Anonymous access now requires `ALLOW_ANONYMOUS_AI=1`.

### HIGH — No payload validation
`messages` was forwarded unchecked. A ~4 MB body is ~1M input tokens, so the
per-request quota was not a cost control.

**Fixed:** ≤40 turns, ≤4,000 chars/message, ≤40,000 total, roles validated, and
a trailing `assistant` turn rejected (prefill jailbreak).

### MEDIUM — Quota queries relied solely on RLS
**Fixed:** added explicit `.eq("user_id", …)` as defence in depth.

### LOW — Internal errors returned to callers
SDK errors embed request IDs and org identifiers.
**Fixed:** logged server-side, generic message returned.

## Open

| # | Severity | Issue |
|---|---|---|
| 1 | **P1** | `/api/tts` and `/api/stt` are authenticated but **unmetered**. One account can loop TTS forever; no length cap on `text`, no size cap on audio. |
| 2 | **P1** | Rate limits are per-user, so scripted signups multiply them. No CAPTCHA, no per-IP ceiling. |
| 3 | **P2** | Schema/RLS live only in the Supabase dashboard — unversioned and unreviewable. Migrations should be committed. |

## Verified clean (checked, not assumed)

- **Secrets:** no key in `src/`, `api/`, or git history. `VITE_` vars are
  correctly public-only; `SUPABASE_SERVICE_ROLE_KEY` is deliberately unprefixed.
- **XSS:** zero `dangerouslySetInnerHTML`/`innerHTML`/`eval`. AI output renders
  as a JSX text child, so React escaping applies.
- **CSRF:** not exploitable. Bearer tokens from `localStorage`, not cookies, so
  there is no ambient credential. No CORS headers exist, so cross-origin
  preflight fails; a form POST cannot set `Authorization`.
- **Authorization:** every user-scoped query filters on a session-derived
  `userId`, never on user input.
- **Webhook:** signature verified over the raw body before any other check.
- **Entitlement:** probed live — a user attacking their own subscription row
  updated 0 rows, deleted 0 rows, and had INSERT rejected by RLS.
