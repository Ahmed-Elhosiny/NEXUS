import type { ReactNode, SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function I({ size = 18, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

/* Brand mark: three nodes converging */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--teal)" />
      <circle cx="16" cy="9.5" r="2.6" fill="var(--raise)" />
      <circle cx="9" cy="22" r="2.6" fill="var(--amber)" />
      <circle cx="23" cy="22" r="2.6" fill="var(--raise)" />
      <path
        d="M16 12.5v3.5m0 0l-5.2 3.8M16 16l5.2 3.8"
        stroke="var(--raise)"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const IcPlus = (p: IconProps) => <I {...p}><path d="M12 5v14M5 12h14" /></I>;
export const IcMinus = (p: IconProps) => <I {...p}><path d="M5 12h14" /></I>;
export const IcX = (p: IconProps) => <I {...p}><path d="M18 6 6 18M6 6l12 12" /></I>;
export const IcCheck = (p: IconProps) => <I {...p}><path d="M20 6 9 17l-5-5" /></I>;
export const IcChevronDown = (p: IconProps) => <I {...p}><path d="m6 9 6 6 6-6" /></I>;
export const IcChevronUp = (p: IconProps) => <I {...p}><path d="m18 15-6-6-6 6" /></I>;
export const IcChevronRight = (p: IconProps) => <I {...p}><path d="m9 18 6-6-6-6" /></I>;
export const IcArrowLeft = (p: IconProps) => <I {...p}><path d="M19 12H5m7 7-7-7 7-7" /></I>;
export const IcArrowRight = (p: IconProps) => <I {...p}><path d="M5 12h14m-7-7 7 7-7 7" /></I>;
export const IcArrowUpRight = (p: IconProps) => <I {...p}><path d="M7 17 17 7M8 7h9v9" /></I>;
export const IcSearch = (p: IconProps) => <I {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></I>;
export const IcBell = (p: IconProps) => <I {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></I>;
export const IcSun = (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></I>;
export const IcMoon = (p: IconProps) => <I {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></I>;
export const IcCommand = (p: IconProps) => <I {...p}><path d="M9 9V6a3 3 0 1 0-3 3h3Zm0 0v6m0-6h6m-6 6v3a3 3 0 1 1-3-3h3Zm6-6h3a3 3 0 1 0-3-3v3Zm0 6v3a3 3 0 1 0 3-3h-3Zm0 0H9" /></I>;
export const IcSettings = (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.82-2.83l.06-.06a1.7 1.7 0 0 0 .33-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.33-1.88l-.06-.06a2 2 0 1 1 2.82-2.82l.06.06a1.7 1.7 0 0 0 1.88.33h.08a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.33l.06-.06a2 2 0 1 1 2.83 2.82l-.06.06a1.7 1.7 0 0 0-.34 1.88v.08a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" /></I>;
export const IcTrash = (p: IconProps) => <I {...p}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6m4-6v6" /></I>;
export const IcPencil = (p: IconProps) => <I {...p}><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" /></I>;
export const IcAlert = (p: IconProps) => <I {...p}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4m0 4h.01" /></I>;
export const IcInfo = (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4m0-4h.01" /></I>;
export const IcDots = (p: IconProps) => <I {...p}><circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" /></I>;
export const IcSpark = (p: IconProps) => <I {...p}><path d="M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M3 12h3m12 0h3M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1" /><circle cx="12" cy="12" r="2.5" /></I>;
export const IcScale = (p: IconProps) => <I {...p}><path d="M12 3v18M8 21h8m-4-18L5 6m14 0-4-3M5 6l-2.5 5.5a3 3 0 0 0 5 0L5 6Zm14 0-2.5 5.5a3 3 0 0 0 5 0L19 6Z" /></I>;
export const IcTarget = (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></I>;
export const IcShield = (p: IconProps) => <I {...p}><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></I>;
export const IcDoc = (p: IconProps) => <I {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" /><path d="M14 2v6h6M9 13h6m-6 4h6" /></I>;
export const IcBook = (p: IconProps) => <I {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Zm0 0A2.5 2.5 0 0 0 6.5 22H20v-5" /></I>;
export const IcHistory = (p: IconProps) => <I {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3.5 2" /></I>;
export const IcChart = (p: IconProps) => <I {...p}><path d="M3 3v18h18" /><path d="m7 14 4-4 3 3 5-6" /></I>;
export const IcSliders = (p: IconProps) => <I {...p}><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" /></I>;
export const IcLayers = (p: IconProps) => <I {...p}><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></I>;
export const IcGrid = (p: IconProps) => <I {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></I>;
export const IcFlag = (p: IconProps) => <I {...p}><path d="M4 22V4c0-.6.4-1 1-1h9l-1.5 4L14 11H5" /></I>;
export const IcClock = (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></I>;
export const IcLink = (p: IconProps) => <I {...p}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></I>;
export const IcFilter = (p: IconProps) => <I {...p}><path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3Z" /></I>;
export const IcGrip = (p: IconProps) => <I {...p}><circle cx="9" cy="6" r="1" fill="currentColor" /><circle cx="15" cy="6" r="1" fill="currentColor" /><circle cx="9" cy="12" r="1" fill="currentColor" /><circle cx="15" cy="12" r="1" fill="currentColor" /><circle cx="9" cy="18" r="1" fill="currentColor" /><circle cx="15" cy="18" r="1" fill="currentColor" /></I>;
export const IcCompass = (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></I>;
export const IcMenu = (p: IconProps) => <I {...p}><path d="M4 6h16M4 12h16M4 18h16" /></I>;
export const IcZap = (p: IconProps) => <I {...p}><path d="M13 2 3 14h7l-1 8 12-13h-8l0-7Z" /></I>;
export const IcEye = (p: IconProps) => <I {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></I>;
export const IcCopy = (p: IconProps) => <I {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></I>;
export const IcRefresh = (p: IconProps) => <I {...p}><path d="M21 12a9 9 0 1 1-2.6-6.4L21 8" /><path d="M21 3v5h-5" /></I>;
