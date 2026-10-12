/**
 * Thin line icon set (1.25px stroke, 24px grid) used across the sections.
 * Colors follow `currentColor`, so icons take the text color of their parent.
 */

const paths = {
  // Product features
  washable: (
    <>
      <path d="M12 3.5c3 3.6 5.5 6.8 5.5 9.8a5.5 5.5 0 0 1-11 0c0-3 2.5-6.2 5.5-9.8Z" />
      <path d="M9.5 14.5a2.6 2.6 0 0 0 2.5 2" />
    </>
  ),
  lowOdor: (
    <>
      <path d="M12 3.5 5 6.5v5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9v-5l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  coverage: (
    <>
      <rect x="3.5" y="4" width="13" height="6" rx="1" />
      <path d="M16.5 7h3v5h-8v3" />
      <rect x="10" y="15" width="3" height="5.5" rx="0.8" />
    </>
  ),
  longLasting: (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9v4l2.5 2.5M9.5 3h5" />
    </>
  ),
  adhesion: (
    <>
      <path d="M4 20h16M6 20V9l6-5 6 5v11" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  drop: (
    <>
      <path d="M12 3.5c3 3.6 5.5 6.8 5.5 9.8a5.5 5.5 0 0 1-11 0c0-3 2.5-6.2 5.5-9.8Z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8 12 3.5Z" />
      <path d="m3.5 12 8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5" />
    </>
  ),
  // Solutions
  interior: (
    <>
      <path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
      <path d="M3.5 13a2 2 0 0 1 4 0v2h9v-2a2 2 0 0 1 4 0v4.5h-17V13ZM6 17.5V20M18 17.5V20" />
    </>
  ),
  exterior: (
    <>
      <path d="M3.5 20.5h17M5 20.5V10l7-6 7 6v10.5" />
      <path d="M9 20.5v-5h6v5M8 11h2M14 11h2" />
    </>
  ),
  ceiling: (
    <>
      <path d="M3.5 4.5h17M12 4.5v4" />
      <path d="M8 13a4 4 0 0 1 8 0H8ZM10.5 16.5h3" />
    </>
  ),
  renovation: (
    <>
      <path d="M14.5 4.5 19.5 9.5 9 20H4v-5L14.5 4.5Z" />
      <path d="m12.5 6.5 5 5" />
    </>
  ),
  primer: (
    <>
      <path d="M9 3.5h6v3l1.5 2v11a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-11l1.5-2v-3Z" />
      <path d="M7.5 12h9" />
    </>
  ),
  pro: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6" />
    </>
  ),
  // Why PAINTIRO
  quality: (
    <>
      <circle cx="12" cy="9.5" r="6" />
      <path d="m8.5 14.5-1.5 6 5-2.5 5 2.5-1.5-6" />
    </>
  ),
  performance: (
    <>
      <path d="M4 15.5a8 8 0 1 1 16 0" />
      <path d="m12 15.5 4-5M3.5 19.5h17" />
    </>
  ),
  expertise: (
    <>
      <path d="M12 3.5 21 8l-9 4.5L3 8l9-4.5Z" />
      <path d="M6.5 10v5c1.5 1.5 3.5 2.2 5.5 2.2s4-.7 5.5-2.2v-5M21 8v5" />
    </>
  ),
  innovation: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" />
    </>
  ),
  eco: (
    <>
      <path d="M5 19c0-8 5-13 14-14-.5 9-5.5 14-14 14Z" />
      <path d="M5 19c3-4 6-6.5 9.5-8.5" />
    </>
  ),
  // UI
  arrow: <path d="M4.5 12h15M14 6.5l5.5 5.5-5.5 5.5" />,
  arrowLeft: <path d="M19.5 12h-15M10 6.5 4.5 12l5.5 5.5" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  play: <path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor" stroke="none" />,
  pin: (
    <>
      <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  send: <path d="M4 12 20 4l-4 16-4.5-6.5L4 12ZM11.5 13.5 20 4" />,
  sparkle: (
    <path d="M12 3.5c.6 4.3 2.2 5.9 6.5 6.5-4.3.6-5.9 2.2-6.5 6.5-.6-4.3-2.2-5.9-6.5-6.5 4.3-.6 5.9-2.2 6.5-6.5ZM18.5 15.5c.3 1.8 1 2.5 2.5 2.8-1.5.3-2.2 1-2.5 2.7-.3-1.7-1-2.4-2.5-2.7 1.5-.3 2.2-1 2.5-2.8Z" />
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1" />
      <path d="m4 6.5 8 6.5 8-6.5" />
    </>
  ),
  phone: (
    <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" />
  ),
  facebook: <path d="M14 8.5h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3.5h2.5V21H14v-6.5h2.5L17 11h-3V9a.5.5 0 0 1 .5-.5Z" />,
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="16.9" cy="7.1" r="0.6" fill="currentColor" />
    </>
  ),
  youtube: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="3.5" />
      <path d="m10.5 9.5 4 2.5-4 2.5v-5Z" fill="currentColor" />
    </>
  ),
  linkedin: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M8 10.5V16M8 7.8v.1M11.5 16v-5.5M11.5 13c0-1.6 1-2.6 2.3-2.6s2.2.9 2.2 2.6v3" />
    </>
  ),
} as const;

export type IconName = keyof typeof paths;

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
};

export default function Icon({ name, size = 24, className = "", strokeWidth = 1.25 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
