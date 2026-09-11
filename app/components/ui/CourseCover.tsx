import Image from "next/image";

import { urlFor } from "@/sanity/lib/image";

/**
 * A course's cover asset rendered as a square, rounded tile — the course page
 * hero and the catalog card tile are the same thing at two sizes.
 *
 * Presentational: it takes a plain asset id, alt text and lqip, so it carries
 * no Sanity client and nothing server-only across a boundary (AGENTS.md §5).
 */
export function CourseCover({
  assetId,
  alt,
  lqip,
  title,
  /** Rendered edge length in CSS pixels. */
  size,
  className = "",
  priority = false,
}: {
  assetId: string | null | undefined;
  alt: string | null | undefined;
  lqip: string | null | undefined;
  /** Falls back to this title's initial when there is no cover asset. */
  title: string | null | undefined;
  size: number;
  className?: string;
  priority?: boolean;
}) {
  if (!assetId) {
    return (
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center rounded-lg bg-neutral-900 font-display font-bold text-white ${className}`}
        style={{ fontSize: size * 0.45, lineHeight: 1 }}
      >
        {title?.charAt(0) ?? "V"}
      </span>
    );
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg bg-neutral-900 ${className}`}
    >
      <Image
        // Twice the rendered size so the tile stays sharp on retina screens.
        src={urlFor(assetId).width(size * 2).height(size * 2).fit("crop").url()}
        alt={alt ?? title ?? ""}
        fill
        sizes={`${size}px`}
        className="object-cover"
        placeholder={lqip ? "blur" : "empty"}
        blurDataURL={lqip ?? undefined}
        priority={priority}
      />
    </div>
  );
}
