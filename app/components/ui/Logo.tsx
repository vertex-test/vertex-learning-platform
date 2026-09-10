import Link from "next/link";

/**
 * The Vertex mark (design system §13): a downward triangle with an inverted
 * triangle cut from its upper centre, split by a slit in the top edge.
 * Drawn as two mirrored arms meeting at the apex.
 */
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="Vertex"
      className={`text-primary-500 ${className}`}
    >
      <path
        fill="currentColor"
        d="M2 3 L15 3 L15 8 L10 8 L16 20 L16 31 Z M30 3 L17 3 L17 8 L22 8 L16 20 L16 31 Z"
      />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2">
      <LogoMark />
      <span className="text-heading-1 font-bold tracking-tight text-neutral-900">
        Vertex
      </span>
    </Link>
  );
}
