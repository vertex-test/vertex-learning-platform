/**
 * Solid play circle (design system §10 "Now Playing", §12 video card action).
 * Lucide's CirclePlay is outline-only, so this is drawn on the same 24px grid.
 */
export function PlayCircleFilled({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M10 8.5 L16 12 L10 15.5 Z" fill="white" />
    </svg>
  );
}
