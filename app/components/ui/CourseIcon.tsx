import { ReactNode } from "react";

/**
 * Brand tiles for the course cards (design/vertex-home.png).
 * Hand-authored inline SVG — no external assets, no network requests.
 * Course icons come from Sanity later; these are placeholders for the
 * three courses in the reference.
 */

function Tile({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-md ${className}`}
    >
      {children}
    </span>
  );
}

export function NextjsIcon() {
  return (
    <Tile className="bg-neutral-900">
      <svg viewBox="0 0 48 48" className="h-11 w-11" fill="none">
        <path
          d="M14 35V13h4.6l14.2 19.4V13"
          stroke="#ffffff"
          strokeWidth="3.2"
          strokeLinecap="square"
        />
        <path d="M32.8 13H37v22" stroke="#ffffff" strokeWidth="3.2" />
      </svg>
    </Tile>
  );
}

export function DockerIcon() {
  return (
    <Tile>
      <svg viewBox="0 0 64 52" className="h-[52px] w-16" fill="none">
        <g fill="#2496ed">
          <rect x="18" y="18" width="8" height="8" rx="1" />
          <rect x="27" y="18" width="8" height="8" rx="1" />
          <rect x="36" y="18" width="8" height="8" rx="1" />
          <rect x="18" y="9" width="8" height="8" rx="1" />
          <rect x="27" y="9" width="8" height="8" rx="1" />
          <rect x="27" y="0" width="8" height="8" rx="1" />
          <rect x="9" y="18" width="8" height="8" rx="1" />
        </g>
        <path
          d="M4 28h56c0 3.6-1 7-3.2 9.9-2.7 3.6-6.8 6-11.7 7.2-4 1-8.6 1.4-13.4 1.1-6.2-.4-11.6-2.2-15.6-5.3C11.4 37.2 8.3 32 7 26c1.8 1.3 3.6 2 5.4 2H4z"
          fill="#2496ed"
        />
        <path
          d="M50 22c1-3 .3-5.7-1.6-8-1.6 1.9-2.3 4-2 6.3.2 1.6.8 2.9 1.8 3.9 1.3-.6 2.2-1.4 1.8-2.2z"
          fill="#2496ed"
        />
      </svg>
    </Tile>
  );
}

export function TypeScriptIcon() {
  return (
    <Tile className="bg-[#3178c6]">
      <span className="text-[26px] leading-none font-bold tracking-tight text-white">
        TS
      </span>
    </Tile>
  );
}
