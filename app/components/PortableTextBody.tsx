import Image from "next/image";
import {
  PortableText,
  type PortableTextComponents,
  type PortableTextBlock,
} from "@portabletext/react";

import { urlFor } from "@/sanity/lib/image";

/**
 * Renders `blockContent` (AGENTS.md §7: content is structured Portable Text,
 * never markdown).
 *
 * Explicit serializers rather than a `prose` class: the design's body copy is
 * plain and mapping each block straight onto the design tokens reproduces it
 * exactly, where a typography preset would need overriding in every direction.
 */

type ImageValue = {
  asset?: { _ref?: string; _id?: string };
  alt?: string;
  caption?: string;
};

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="text-body-lg leading-7 text-neutral-700">{children}</p>
    ),
    h2: ({ children }) => (
      <h3 className="text-heading-2 font-semibold text-neutral-900">
        {children}
      </h3>
    ),
    h3: ({ children }) => (
      <h4 className="text-heading-3 font-semibold text-neutral-900">
        {children}
      </h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-primary-500 pl-5 text-body-lg leading-7 text-neutral-700 italic">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc space-y-2 pl-5 text-body-lg leading-7 text-neutral-700 marker:text-primary-500">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal space-y-2 pl-5 text-body-lg leading-7 text-neutral-700 marker:text-neutral-500">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="pl-1">{children}</li>,
    number: ({ children }) => <li className="pl-1">{children}</li>,
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-neutral-900">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="rounded-xs bg-neutral-100 px-1.5 py-0.5 font-mono text-body text-neutral-900">
        {children}
      </code>
    ),
    link: ({ children, value }) => {
      const href = typeof value?.href === "string" ? value.href : undefined;
      if (!href) return <>{children}</>;

      // Author-supplied external URLs (the schema allows http/https/mailto).
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-500 underline underline-offset-2 hover:text-primary-600"
        >
          {children}
        </a>
      );
    },
  },
  types: {
    image: ({ value }: { value: ImageValue }) => {
      const assetId = value?.asset?._ref ?? value?.asset?._id;
      if (!assetId) return null;

      return (
        <figure className="overflow-hidden rounded-md border border-neutral-200">
          <Image
            src={urlFor(assetId).width(1600).fit("max").url()}
            alt={value.alt ?? ""}
            width={800}
            height={450}
            sizes="(min-width: 1024px) 720px, 100vw"
            className="h-auto w-full"
          />
          {value.caption && (
            <figcaption className="border-t border-neutral-200 bg-neutral-50 px-4 py-3 text-small text-neutral-500">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },
};

export function PortableTextBody({
  value,
  className = "",
}: {
  /**
   * TypeGen emits `blockContent` with optional `children` and `markDefs`,
   * where `PortableTextBlock` requires them, so the generated type is not
   * assignable as-is. Accepting the structural shape and narrowing once here
   * keeps that mismatch in one place instead of at every call site.
   */
  value: { _type: string }[] | null | undefined;
  className?: string;
}) {
  if (!value || value.length === 0) return null;

  return (
    <div className={`space-y-5 ${className}`}>
      <PortableText
        value={value as PortableTextBlock[]}
        components={components}
      />
    </div>
  );
}
