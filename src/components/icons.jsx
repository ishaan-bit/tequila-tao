// src/components/icons.jsx — a small, consistent stroke-icon set.
// One <Icon> primitive draws a 24×24 stroked path at a shared weight, so every
// icon-badge and list row reads from the same visual family (this is what
// replaces the old bare "Label →" text links with something modern). Icons are
// decorative — callers provide the accessible label on the surrounding control.
function Icon({ size = 20, stroke = 1.8, children, className = "", style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      style={style}
    >
      {children}
    </svg>
  );
}

export const BookIcon = (p) => (
  <Icon {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
    <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />
  </Icon>
);
export const InfoIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 7.6h.01" />
  </Icon>
);
export const ShieldIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3.5l7 2.6v4.7c0 4.3-3 7.6-7 8.7-4-1.1-7-4.4-7-8.7V6.1z" />
    <path d="M9 12l2.2 2.2L15.5 10" />
  </Icon>
);
export const DocIcon = (p) => (
  <Icon {...p}>
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4" />
    <path d="M9 13h6M9 16.5h6" />
  </Icon>
);
export const DownloadIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3v12" />
    <path d="M7 11l5 5 5-5" />
    <path d="M5 20h14" />
  </Icon>
);
export const UploadIcon = (p) => (
  <Icon {...p}>
    <path d="M12 21V9" />
    <path d="M7 13l5-5 5 5" />
    <path d="M5 4h14" />
  </Icon>
);
export const ResetIcon = (p) => (
  <Icon {...p}>
    <path d="M4 12a8 8 0 1 1 2.5 5.8" />
    <path d="M4 19v-4h4" />
  </Icon>
);
export const TrashIcon = (p) => (
  <Icon {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V5h6v2" />
    <path d="M6 7l1 13h10l1-13" />
    <path d="M10 11v6M14 11v6" />
  </Icon>
);
export const ReplayIcon = (p) => (
  <Icon {...p}>
    <path d="M3 12a9 9 0 1 0 9-9" />
    <path d="M3 4v4h4" />
    <path d="M11 9l3 3-3 3" />
  </Icon>
);
export const BellIcon = (p) => (
  <Icon {...p}>
    <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </Icon>
);
export const SlidersIcon = (p) => (
  <Icon {...p}>
    <path d="M5 6h9M18 6h1M5 18h1M10 18h9" />
    <path d="M5 12h6M15 12h4" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="8" cy="18" r="2" />
    <circle cx="13" cy="12" r="2" />
  </Icon>
);
export const TargetIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
  </Icon>
);
export const WalletIcon = (p) => (
  <Icon {...p}>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v0H6.5" />
    <path d="M4 7.5V18a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H6" />
    <path d="M16.5 13.5h.01" />
  </Icon>
);
export const SparkleIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
    <path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
  </Icon>
);
export const HeartIcon = (p) => (
  <Icon {...p}>
    <path d="M12 20s-7-4.4-9.2-8.6C1.3 8.3 2.8 5 6 5c2 0 3.2 1.2 4 2.4C10.8 6.2 12 5 14 5c3.2 0 4.7 3.3 3.2 6.4C19 15.6 12 20 12 20z" />
  </Icon>
);
export const ChevronRight = (p) => (
  <Icon {...p}>
    <path d="M9 6l6 6-6 6" />
  </Icon>
);
export const InstallIcon = (p) => (
  <Icon {...p}>
    <rect x="6" y="3" width="12" height="18" rx="2.5" />
    <path d="M12 7v6" />
    <path d="M9.5 10.5L12 13l2.5-2.5" />
  </Icon>
);
export const DatabaseIcon = (p) => (
  <Icon {...p}>
    <ellipse cx="12" cy="6" rx="7" ry="3" />
    <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
    <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
  </Icon>
);
export const CheckIcon = (p) => (
  <Icon {...p}>
    <path d="M5 12.5l4.5 4.5L19 6.5" />
  </Icon>
);
export const CloudIcon = (p) => (
  <Icon {...p}>
    <path d="M7 18h9a3.6 3.6 0 0 0 .5-7.16A5.5 5.5 0 0 0 5.9 9.6 3.7 3.7 0 0 0 7 18Z" />
  </Icon>
);
export const PhoneIcon = (p) => (
  <Icon {...p}>
    <path d="M6.8 3.5H10l1.3 4-2.1 1.4a12 12 0 0 0 5 5l1.4-2.1 4 1.3v3.2a2 2 0 0 1-2.2 2A16 16 0 0 1 4.8 5.7 2 2 0 0 1 6.8 3.5Z" />
  </Icon>
);

/* ---- Milestone tiers (line-icons, one optical family, shown in gold) ---- */
export const SproutIcon = (p) => (
  <Icon {...p}>
    <path d="M12 21v-9" />
    <path d="M12 12c0-3 2.3-4.5 5-4.5C17 10.7 14.7 12 12 12Z" />
    <path d="M12 13c0-2.6-2.2-4-4.5-4C7.5 11.6 9.7 13 12 13Z" />
  </Icon>
);
export const LeafIcon = (p) => (
  <Icon {...p}>
    <path d="M5 19c0-8 6-13 14-13 .5 7-4 14-12 14-1.2 0-2-.8-2-1Z" />
    <path d="M8 18c2.5-4 5-6 9-7.5" />
  </Icon>
);
export const TreeIcon = (p) => (
  <Icon {...p}>
    <path d="M12 21v-5" />
    <path d="M12 3l5 7h-3l4 5H6l4-5H7z" />
  </Icon>
);
export const MountainIcon = (p) => (
  <Icon {...p}>
    <path d="M3 19l6-11 4 6 2-3 6 8z" />
    <path d="M7.5 12.5l1.5-2.7 1.6 2.4" />
  </Icon>
);
export const StarIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3.5l2.5 5.3 5.5.7-4 3.9 1 5.6L12 16.9 6.5 19l1-5.6-4-3.9 5.5-.7z" />
  </Icon>
);
export const TrophyIcon = (p) => (
  <Icon {...p}>
    <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
    <path d="M7 5H4v1a3 3 0 0 0 3 3M17 5h3v1a3 3 0 0 1-3 3" />
    <path d="M10 13.5V16M14 13.5V16M8.5 20h7M9 20l.5-4h5l.5 4" />
  </Icon>
);
export const MedalIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="14" r="5" />
    <path d="M12 14l.01 0" />
    <path d="M9 3l3 5 3-5" />
  </Icon>
);

/* ---- Recover checklist glyphs ---- */
export const DropletIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3.5c3.5 4 6 7 6 10a6 6 0 0 1-12 0c0-3 2.5-6 6-10z" />
  </Icon>
);
export const LungsIcon = (p) => (
  <Icon {...p}>
    <path d="M12 4v8" />
    <path d="M12 8c-.5-1.5-2-2-2.8-1-1 1.2-2.2 4-2.2 6.5 0 2 1 3 2.5 3s2.5-1 2.5-3z" />
    <path d="M12 8c.5-1.5 2-2 2.8-1 1 1.2 2.2 4 2.2 6.5 0 2-1 3-2.5 3s-2.5-1-2.5-3z" />
  </Icon>
);
export const ForkIcon = (p) => (
  <Icon {...p}>
    <path d="M7 3v6a2 2 0 0 0 4 0V3M9 9v12" />
    <path d="M16 3c-1.5 0-2.5 2-2.5 5 0 2 1 3 2.5 3M16 3v18" />
  </Icon>
);
export const CoffeeIcon = (p) => (
  <Icon {...p}>
    <path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
    <path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2" />
    <path d="M8 3v2.5M11.5 3v2.5" />
  </Icon>
);
export const SplashIcon = (p) => (
  <Icon {...p}>
    <path d="M12 5a4.5 4.5 0 0 0 0 9 4.5 4.5 0 0 0 0-9z" />
    <path d="M4 8l1.5 1M20 8l-1.5 1M5 16l1.5-1M19 16l-1.5-1M12 20v-2" />
  </Icon>
);
export const WalkIcon = (p) => (
  <Icon {...p}>
    <circle cx="13" cy="4.5" r="1.6" />
    <path d="M13 8l-2 4 3 2 1 6M11 12l-3 1-1 4M14 14l3 1" />
  </Icon>
);
export const ShieldCheckIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3.5l7 2.6v4.7c0 4.3-3 7.6-7 8.7-4-1.1-7-4.4-7-8.7V6.1z" />
    <path d="M9 12l2.2 2.2L15.5 10" />
  </Icon>
);
