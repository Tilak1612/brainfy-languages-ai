# Tutor portrait images

Drop four portrait files here and the app switches from monogram avatars to real
faces with no code change beyond setting four `face` fields.

## How to wire them in

1. Add the files here with these exact names (square, ideally 512×512, `.webp`):

   | File | Tutor | Accent |
   |------|-------|--------|
   | `maya.webp`  | Maya  | purple |
   | `kenji.webp` | Kenji | green  |
   | `leo.webp`   | Léo   | orange |
   | `amara.webp` | Amara | blue   |

2. Set the `face` field on each tutor in `src/data.ts`:

   ```ts
   { initials: "M", name: "Maya",  …, face: "/tutors/maya.webp" },
   { initials: "K", name: "Kenji", …, face: "/tutors/kenji.webp" },
   { initials: "L", name: "Léo",   …, face: "/tutors/leo.webp" },
   { initials: "A", name: "Amara", …, face: "/tutors/amara.webp" },
   ```

That is the whole change. `TutorAvatar` renders the image on the Tutors grid,
the Dashboard card and the Voice header, and falls back to the gradient monogram
automatically if a file is missing or fails to load — so a half-finished set
never shows a broken-image icon.

## Art direction (keep all four cohesive)

Fixed line for every portrait, so the row reads as one set:

> Photorealistic head-and-shoulders portrait, front-facing, looking directly at
> camera, warm friendly expression, soft even studio lighting, 85mm lens,
> shallow depth of field, solid [ACCENT] seamless background, centered square
> composition, natural skin texture, clean professional avatar.

Per-tutor persona (derived from name + teaching role):

- **Maya** — Conversation, warm & patient. Approachable woman, early 30s, soft
  smile, casual warm styling. Background: deep purple `#5B4BE8`.
- **Kenji** — Grammar coach, precise & structured. Composed man, Japanese
  background, neat professional look. Background: green `#1FA971`.
- **Léo** — Pronunciation, energetic. Young man, expressive, warm European feel.
  Background: orange `#FF6B4A`.
- **Amara** — Business & interview, polished. Confident woman, African/global
  roots, business attire. Background: blue `#3B6FE0`.

Generate all four with the same fixed line so framing, lighting and style match.
