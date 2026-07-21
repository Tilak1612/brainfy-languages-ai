# Release & Launch Checklist

## Blocking (must be true before public launch)

- [ ] **Mobile layout** — currently unusable below ~1000px
- [ ] **Router/URLs** — back button and deep links work
- [ ] **Content ≥ 10 hours** — currently ~20 minutes
- [ ] **TTS/STT metered** — currently unlimited per account
- [ ] **Stripe live mode** — products, prices, webhook, secrets
- [ ] **NVIDIA Riva rate confirmed** — unit economics unverified without it
- [ ] **Email confirmation resolved** — currently ON with no sender configured, so signup dead-ends
- [ ] Onboarding for first-run users

## Verified already

- [x] No secrets in repo or git history
- [x] All metered endpoints require auth and fail closed
- [x] System prompt cannot be supplied by the client
- [x] Payloads bounded
- [x] Webhook signature verified before any other check
- [x] Users cannot self-grant Pro (probed)
- [x] Users cannot read others' data (probed)
- [x] Quota is tamper-proof (no DELETE policy)
- [x] No fabricated progress on any screen
- [x] Error boundary prevents whole-app white-screen
- [x] Build passes; 12 tests pass
- [x] Contrast meets AA; reduced-motion honoured; focus visible

## Pre-deploy commands

```bash
npm run test      # 12 tests
npx tsc -b        # NOT `tsc --noEmit` — root tsconfig has files:[] and checks nothing
npm run build
```

## Post-deploy smoke test

1. `GET /api/health` → `{"ai":true,"voice":true}`
2. `POST /api/chat` unauthenticated → **401**
3. `POST /api/stripe-webhook` with a bad signature → **400**
4. Sign up → confirm → land on dashboard at **zero** XP/streak
5. Complete a lesson → XP rises → reload → XP persists
6. Subscribe with `4242…` → `lang_subscriptions` row `trialing` → quota flips
