import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/** Stroke-based icon wrapper (color follows currentColor). `sw` = stroke width. */
function Stroke({
  size = 18,
  sw = 1.7,
  children,
  ...rest
}: IconProps & { sw?: number; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
      strokeWidth={sw}
      {...rest}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 10.5 12 4l8 6.5M6 9.5V20h12V9.5" />
  </Stroke>
);

export const MicIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </Stroke>
);

export const MicOffIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3M4 4l16 16" />
  </Stroke>
);

export const BookIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" />
  </Stroke>
);

export const WaveIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3 12h3l2-5 4 14 3-9 2 3h4" />
  </Stroke>
);

export const ChartIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 20V4M4 20h16M8 16l3.5-4 3 2.5L20 8" />
  </Stroke>
);

export const UserIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5.5 20c.7-3.4 3.3-5.2 6.5-5.2s5.8 1.8 6.5 5.2" />
  </Stroke>
);

export const SearchIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </Stroke>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M8 10l4 4 4-4" />
  </Stroke>
);

export const BellIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7ZM10 20a2 2 0 0 0 4 0" />
  </Stroke>
);

export const BackIcon = (p: IconProps) => (
  <Stroke {...p} sw={1.8}>
    <path d="M15 5l-7 7 7 7" />
  </Stroke>
);

export const SkipIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M11 5 6 12l5 7M18 5l-5 7 5 7" />
  </Stroke>
);

export const CubeIcon = (p: IconProps) => (
  <Stroke {...p} sw={1.6}>
    <path d="M11 5.5a2 2 0 0 1 2 0l6 3.5v6l-6 3.5a2 2 0 0 1-2 0L5 15V9l6-3.5Z" />
  </Stroke>
);

export const CheckIcon = ({ size = 30, sw = 2.2, ...rest }: IconProps & { sw?: number }) => (
  <Stroke size={size} sw={sw} {...rest}>
    <path d="M5 13l4 4L19 7" />
  </Stroke>
);

export const LockIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Stroke>
);

export const PlusIcon = (p: IconProps) => (
  <Stroke {...p} sw={2}>
    <path d="M12 5v14M5 12h14" />
  </Stroke>
);

export const SettingsBurstIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
  </Stroke>
);

/* ---- Filled icons (accept a color) ---- */

export const FlameIcon = ({ size = 15, color = "#FF6B4A", ...rest }: IconProps & { color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
    <path
      d="M12 3c1.2 3-1.5 4.2-1.5 6.5A2.4 2.4 0 0 0 13 12c1.6-.6 2-2.2 1.5-3 2 1.4 3 3.4 3 5.6a5.5 5.5 0 1 1-11 0C6.5 10 9.8 8 9 4.5c1 .3 2 .8 3-1.5Z"
      fill={color}
    />
  </svg>
);

export const StarIcon = ({ size = 15, color = "#F5A524", ...rest }: IconProps & { color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
    <path
      d="M12 2l2.6 6.6L21 9.3l-5 4.3 1.6 6.4L12 16.9 6.4 20l1.6-6.4-5-4.3 6.4-.7L12 2Z"
      fill={color}
    />
  </svg>
);

export const SparkleIcon = ({
  size = 15,
  color = "#5B4BE8",
  filled = true,
  ...rest
}: IconProps & { color?: string; filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
    <path
      d="M12 3l2 5 5 .5-3.8 3.4 1.1 5.1L12 19.4 7.7 17l1.1-5.1L5 8.5 10 8l2-5Z"
      fill={filled ? color : "none"}
      stroke={filled ? "none" : color}
      strokeWidth={filled ? 0 : 1.5}
    />
  </svg>
);

export const PlayIcon = ({ size = 15, color = "#fff", ...rest }: IconProps & { color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
    <path d="M8 5v14l11-7L8 5Z" fill={color} />
  </svg>
);

export const HangupIcon = ({ size = 26, color = "#fff", ...rest }: IconProps & { color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
    <path
      d="M5.5 5.5c4-2.5 9-2.5 13 0 .9.6 1.2 1.8.7 2.8l-1 1.9c-.4.8-1.4 1.1-2.2.8l-2.1-.8a1.8 1.8 0 0 1-1.2-1.7v-1c-1.6-.5-3.2-.5-4.8 0v1a1.8 1.8 0 0 1-1.2 1.7l-2.1.8c-.8.3-1.8 0-2.2-.8l-1-1.9c-.5-1-.2-2.2.7-2.8Z"
      fill={color}
    />
  </svg>
);

export const CalendarIcon = ({ size = 19, color = "#C6890A", ...rest }: IconProps & { color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
    <rect x="4" y="5" width="16" height="15" rx="2" stroke={color} strokeWidth={1.7} />
    <path d="M4 9h16M8 3v4M16 3v4" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
  </svg>
);

export const LessonPairIcon = ({ size = 19, color = "#1FA971", ...rest }: IconProps & { color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
    <path
      d="M5 4h6v16H5.5A1.5 1.5 0 0 1 4 18.5V5a1 1 0 0 1 1-1ZM19 4h-6v16h5.5a1.5 1.5 0 0 0 1.5-1.5V5a1 1 0 0 0-1-1Z"
      stroke={color}
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
  </svg>
);

export const BrandLogoIcon = ({ size = 19, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
    <path
      d="M12 3c-3.6 0-6.5 2.7-6.5 6 0 1.9.9 3.6 2.4 4.7v2.8c0 .5.5.9 1 .8l2.2-.6c.3.06.6.08.9.08 3.6 0 6.5-2.7 6.5-6S15.6 3 12 3Z"
      stroke="#fff"
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
    <circle cx="9.4" cy="9" r="1" fill="#fff" />
    <circle cx="12" cy="9" r="1" fill="#fff" />
    <circle cx="14.6" cy="9" r="1" fill="#fff" />
  </svg>
);
