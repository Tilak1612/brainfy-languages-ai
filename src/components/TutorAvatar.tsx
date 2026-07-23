import { useState } from "react";
import type { Tutor } from "../data";

/**
 * A tutor's avatar. Renders the portrait image when the tutor has one, and
 * falls back to the coloured-gradient monogram the app has always used —
 * including when the image URL is set but fails to load (404, offline, broken
 * host). The monogram is never "gone", it is the floor.
 *
 * `size` is the box edge in px; `radius` is the corner radius in px. Font size
 * scales with the box so the initials stay proportional across the three places
 * avatars appear (Tutors grid, Dashboard card, Voice header).
 */
export default function TutorAvatar({
  tutor,
  size,
  radius,
  className = "",
}: {
  tutor: Pick<Tutor, "initials" | "name" | "grad"> & { face?: string };
  size: number;
  radius: number;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(tutor.face) && !broken;

  return (
    <div
      className={`relative flex flex-none items-center justify-center overflow-hidden font-display font-extrabold text-white ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: tutor.grad,
        fontSize: Math.round(size * 0.38),
        // Understated "AI signature": a faint inner rim-light so the portrait
        // reads as a crafted avatar, not a raw cutout, and its edge blends into
        // the tile instead of showing a hard seam. Kept subtle on purpose.
        boxShadow:
          "inset 0 1px 1px rgba(255,255,255,.28), inset 0 0 0 1px rgba(255,255,255,.10)",
      }}
    >
      {showImage ? (
        <img
          src={tutor.face}
          alt={tutor.name}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        // aria-hidden: the initials are decorative once the container conveys
        // the tutor via adjacent name text; a screen reader reading "M" adds noise.
        <span aria-hidden="true">{tutor.initials}</span>
      )}
    </div>
  );
}
