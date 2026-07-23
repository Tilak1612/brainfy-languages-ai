# Brainfy Tutor Style Guide

The rules every tutor portrait follows so the four read as one team, not four
stock photos. Generate every new or replacement tutor against this guide rather
than prompting each one from scratch — that is what keeps the set cohesive
(the approach Apple / Google / OpenAI use for character consistency).

## Current roster

There are **five** tutors. (The demo *learner* is named "Demo" — not a tutor.
Sofia was originally only that placeholder learner name, which is why earlier
reviews mistook it for a tutor; she is now a real, distinct tutor with her own
specialty and accent colour.)

| File | Tutor | Role | Accent | Visual cue |
|------|-------|------|--------|-----------|
| `maya.webp`  | Maya  | Conversation | purple `#5B4BE8` | warm open smile, relaxed, purple layer |
| `kenji.webp` | Kenji | Grammar coach | green `#1FA971` | calm, composed, precise, teal jacket |
| `leo.webp`   | Léo   | Pronunciation | orange `#FF6B4A` | energetic, expressive, open collar |
| `amara.webp` | Amara | Business & interview | blue `#3B6FE0` | confident, executive presence, scarf |
| `sofia.webp` | Sofia | Travel & culture | rose `#E24A93` | friendly, approachable, purple layer |

A viewer should be able to guess the role from the face before reading the text.

## Fixed rules (same for all)

- **Framing:** square, upper chest to just above the top of the head, subject
  centered. Face fills ~45–55% of the frame — recognisable at a 56–80 px avatar.
- **Camera:** eye-level, front-facing, looking directly into the lens (real eye
  contact), 85 mm-equivalent, shallow depth of field.
- **Lighting:** soft, even, key from front-left, gentle fill — no hard shadows,
  no blown highlights. Same direction and brightness for every tutor.
- **Background:** transparent (true alpha, not a baked checkerboard). The face
  floats on the tutor's accent tile in-app.
- **Colour grade:** clean, warm-neutral, premium (Apple/Google marketing feel).
  Consistent white balance across all four.
- **Expression:** genuine, warm, approachable. Vary the *intensity* by role
  (below), never the lighting or angle.

## Per-tutor direction

Keep everything above fixed; change only wardrobe accent and expression.

- **Maya — Conversation.** Warmest, most open smile; relaxed posture. Purple
  layer (blazer or sweater) nodding to her accent.
- **Kenji — Grammar.** Calm, analytical, precise; slight confident smile, not a
  grin. Navy/teal jacket.
- **Léo — Pronunciation.** Energetic and expressive; the biggest, liveliest
  smile. Lighter, more casual (open collar, white shirt).
- **Amara — Business & interview.** Executive presence; confident, polished,
  composed. Structured blazer, professional accessory.
- **Sofia — Travel & culture.** Friendly and approachable; relaxed, open smile.
  Casual-smart, warm styling. Rose accent, distinct from Maya's purple.

## Subtle AI signature

Understated only — they must still read as human:
- A faint blue/purple rim light on the hair/shoulder edge.
- A small brand-coloured accent in the wardrobe.
- No glow, no obvious sci-fi treatment.

(In-app, `TutorAvatar` also adds a faint inner rim-light via CSS so the cutout
blends into the tile — the image itself should not fake this.)

## Diversity

As the roster grows, vary age, ethnicity, and professional style so the set
reflects a global audience. The four current tutors already span multiple
ethnicities; keep widening it with each addition.

## Pipeline (how the files here were made)

Generated externally to the guide above, then processed for the app:

1. Square source portrait, transparent background.
2. Tighter crop (central ~82%, ~2% top margin) → upper-chest-to-head framing.
3. Alpha erosion ~2 px to defringe the cutout (kills the light halo edge).
4. Resize to 512×512, encode WebP `quality=84, method=6` → ~40–60 KB each.

```python
from PIL import Image, ImageFilter
im = Image.open("source.png").convert("RGBA")
w, h = im.size
side = int(w * 0.82); left = (w - side) // 2; top = int(h * 0.02)
c = im.crop((left, top, left + side, top + side))
a = c.split()[3].filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MinFilter(3))
c.putalpha(a)
c.resize((512, 512), Image.LANCZOS).save("public/tutors/<name>.webp", "WEBP", quality=84, method=6)
```

## Wiring

`src/data.ts` sets `face: "/tutors/<name>.webp"` per tutor. `TutorAvatar`
renders it on the Tutors grid (78 px), Dashboard card (56 px) and Voice header
(46 px), scales on card hover, and falls back to the gradient monogram if a file
is ever missing. To replace a portrait: drop a new `public/tutors/<name>.webp`
through the pipeline above — no code change.

Adding a new tutor takes four edits: a row in `tutors` (`src/data.ts`) with a
unique `grad` and `face`, a `BADGES` + `GREETINGS` entry in `src/lib/tutors.ts`,
and a **server-side persona** in `api/_personas.ts` (the client never sends the
prompt — without a persona entry the AI has no instructions for that tutor).
