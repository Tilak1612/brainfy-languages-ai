# Database migrations

The Postgres schema, row-level-security policies, and functions for Brainfy
Languages AI. **This directory is the source of truth for the database
structure** — until now it lived only inside the hosted Supabase project and was
not version-controlled, so a bad click in the dashboard would have been
unrecoverable with no history.

Production project ref: `qwpxcwnnobalpglbwzip` (the ref is public — it's already
in the deployed client's `VITE_SUPABASE_URL`; security is enforced by RLS, not
by hiding it).

## What's here

Each file in `migrations/` is `<timestamp>_<name>.sql`, applied in filename
order. They were reverse-engineered from the live project's migration history
(`supabase_migrations.schema_migrations`) — the SQL is byte-for-byte what was
already applied, and the live schema was verified to contain exactly these
objects and nothing more.

| Migration | What it adds |
|-----------|--------------|
| `…062928_…core` | Per-user tables: profiles, progress, SRS cards, custom tutors, settings. RLS: owner-only. |
| `…062939_…new_user_bootstrap` | `SECURITY DEFINER` trigger that seeds a profile/progress/settings row on signup. |
| `…062949_…api_usage_quota` | Usage log backing the API quota. INSERT+SELECT only, so a user can't delete rows to escape the limit. |
| `…042800_…subscriptions` | Stripe subscription state + `lang_is_pro()`. SELECT-only for owners; only the webhook (service role) writes it. |
| `…042817_…lock_is_pro_fn` | Revokes `lang_is_pro` from `authenticated` so nobody can probe others' subscription status via RPC. |
| `…153837_…content_schema` | Shared learning content (units, lessons, vocab, conversation steps). Read-only, published rows only. CHECK constraints reject unsolvable exercises. |
| `…184401_…activity_history` | Per-day practice history + conversation counter on `lang_progress`. |
| `…073125_…onboarded_flag` | First-run `onboarded` flag on `lang_progress`. |

## Security invariants (enforced by the SQL here, verified against the live DB)

- Every user table has RLS enabled with an owner-only policy.
- `lang_subscriptions` and `lang_api_usage` are **read-only to the owner** — no
  UPDATE/DELETE policy exists, so users cannot self-grant Pro or wipe usage.
- Content tables are read-only and only expose `published` rows.
- `SECURITY DEFINER` functions (`lang_handle_new_user`, `lang_is_pro`) are
  revoked from `anon`/`authenticated` so they aren't callable via PostgREST RPC.

## Applying to a new environment

With the Supabase CLI:

```bash
supabase link --project-ref <ref>
supabase db push
```

The migrations are idempotent where it matters (`create table if not exists`,
`create or replace function`, `add column if not exists`). They do **not**
include seed content — units/lessons/vocab are data, authored separately through
`scripts/generate-content.mjs` using the service-role key.

## Changing the schema

Make changes as a **new** migration file (new timestamp), never by editing an
applied one. Apply it to the project, then confirm the file and the live DB
still agree.
