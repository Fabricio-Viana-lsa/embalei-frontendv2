import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const Icon = {
  user: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.8} {...p}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  cake: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.8} {...p}>
      <path d="M20 21H4v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7Z" />
      <path d="M4 16s1.5-2 4-2 3.5 2 4 2 1.5-2 4-2 4 2 4 2" />
      <path d="M2 21h20" />
      <path d="M7 8v3" />
      <path d="M12 8v3" />
      <path d="M17 8v3" />
      <path d="M7 4l.01 2" />
      <path d="M12 4l.01 2" />
      <path d="M17 4l.01 2" />
    </svg>
  ),
  chev: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={2} {...p}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  arrow: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={2.4} {...p}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  scan: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={2} {...p}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  ),
  check: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={3} {...p}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  box: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.8} {...p}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  truck: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.8} {...p}>
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  thermo: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.8} {...p}>
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4 4 0 1 0 5 0z" />
    </svg>
  ),
  play: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  logout: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={2} {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  reset: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={2} {...p}>
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
  keyboard: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.8} {...p}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
    </svg>
  ),
  pkg: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.8} {...p}>
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  drop: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.8} {...p}>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  pencil: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={2} {...p}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
};
