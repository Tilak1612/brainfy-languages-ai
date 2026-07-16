# Brainfy Languages AI

An AI-native language-learning app — voice conversation, interactive lessons,
spaced-repetition review, pronunciation feedback, and progress tracking.
Built with **Vite + React + TypeScript + Tailwind**.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Real AI tutor (optional)

The Voice Tutor becomes a live conversation with Claude when an Anthropic API
key is configured. Without a key it falls back to a scripted tutor, so the app
works either way.

- **Local:** copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`.
- **Vercel:** add `ANTHROPIC_API_KEY` under Project → Settings → Environment
  Variables, then redeploy.

The key is used only server-side (`/api/chat`) and is never bundled into the
browser.

## Build

```bash
npm run build   # tsc + vite build → dist/
```

## Structure

- `src/screens/` — Dashboard, Voice, Lesson, Review, Pronunciation, Progress, Tutors
- `src/lib/` — persistent store, spaced-repetition scheduler, chat client
- `src/content/` — lessons, vocabulary deck, conversation script
- `api/` — Vercel serverless functions for the AI tutor
- `vite.config.ts` — dev-server AI proxy middleware
