# Tutor portrait images

The four tutors have photorealistic portraits, served from `public/tutors/`:

| File | Tutor | Accent | Source |
|------|-------|--------|--------|
| `maya.webp`  | Maya  | purple | Gemini-generated portrait, purple styling, warm smile |
| `kenji.webp` | Kenji | green  | Gemini-generated portrait, teal blazer |
| `leo.webp`   | Léo   | orange | Gemini-generated portrait, open collar, waveform pin |
| `amara.webp` | Amara | blue   | Gemini-generated portrait, purple scarf, polished |

Each is 512×512 WebP with a transparent background, so the face floats on the
tutor's accent-color tile. Originals were 2048×2048 PNGs (~7 MB each); resized
and re-encoded to ~45–65 KB with Pillow (`quality=82, method=6`).

`src/data.ts` sets `face: "/tutors/<name>.webp"` on each tutor. `TutorAvatar`
renders the image on the Tutors grid, the Dashboard card and the Voice header,
and falls back to the gradient monogram if a file is ever missing or fails to
load — so the app never shows a broken-image icon.

## Replacing a portrait

1. Drop a new square image in `public/tutors/<name>.webp` (keep the name).
2. That's it — no code change. To resize/convert a large source:

   ```python
   from PIL import Image
   im = Image.open("source.png").convert("RGBA").resize((512, 512), Image.LANCZOS)
   im.save("public/tutors/<name>.webp", "WEBP", quality=82, method=6)
   ```

## Art direction (for a cohesive new set)

Fixed line for every portrait so the row reads as one set:

> Photorealistic head-and-shoulders portrait, front-facing, looking directly at
> camera, warm friendly expression, soft even studio lighting, 85mm lens,
> shallow depth of field, transparent/seamless background, centered square
> composition, natural skin texture, clean professional avatar.

Per-tutor persona (name + teaching role):

- **Maya** — Conversation, warm & patient. Approachable woman, soft smile,
  purple styling. Accent purple `#5B4BE8`.
- **Kenji** — Grammar coach, precise. Composed man, Japanese background, neat.
  Accent green `#1FA971`.
- **Léo** — Pronunciation, energetic. Young man, expressive. Accent orange `#FF6B4A`.
- **Amara** — Business & interview, polished. Confident woman, professional.
  Accent blue `#3B6FE0`.
