import {
  Code,
  Download,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Newspaper,
  Play,
} from "lucide-react";
import type { ComponentType } from "react";

/**
 * The Resources row (design/vertex-lesson.png). A server component: each card
 * is a plain external link, so nothing here needs to be interactive.
 */

export interface LessonResource {
  key: string;
  type: string | null;
  title: string;
  description: string | null;
  url: string;
}

/** Matches the `lessonResource.type` options in the Studio schema. */
const typeIcons: Record<string, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  documentation: FileText,
  article: Newspaper,
  code: Code,
  download: Download,
  video: Play,
  link: LinkIcon,
};

export function LessonResources({
  resources,
}: {
  resources: LessonResource[];
}) {
  if (resources.length === 0) return null;

  return (
    <section className="border-t border-neutral-200 pt-8">
      <h3 className="text-heading-2 font-semibold text-neutral-900">
        Resources
      </h3>

      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => {
          const Icon = typeIcons[resource.type ?? "link"] ?? LinkIcon;

          return (
            <li key={resource.key}>
              <a
                href={resource.url}
                // Author-supplied external URLs.
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-full flex-col gap-3 rounded-md border border-neutral-200 bg-white p-5 shadow-sm outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
              >
                <span className="flex items-start gap-3">
                  <Icon
                    className="mt-0.5 h-5 w-5 shrink-0 text-neutral-900"
                    strokeWidth={2}
                  />
                  <span className="min-w-0 flex-1 text-body-lg font-medium text-neutral-900">
                    {resource.title}
                  </span>
                </span>

                <span className="flex items-end justify-between gap-3">
                  <span className="min-w-0 flex-1 text-body text-neutral-500">
                    {resource.description}
                  </span>
                  <ExternalLink
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-primary-500"
                    strokeWidth={2}
                  />
                </span>
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
