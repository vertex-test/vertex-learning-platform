"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

import { captureEvent } from "@/app/lib/posthog-client";
import { ButtonLink } from "../ui/Button";

/**
 * The sticky Previous / Next bar (design/vertex-lesson.png, bottom).
 *
 * Neighbours run continuously across module boundaries, so the last lesson of
 * a module is followed by the first lesson of the next one. Either end is
 * omitted at the start and end of the course.
 */

export interface FooterLesson {
  title: string;
  slug: string;
  duration: string;
}

export function LessonFooterNav({
  previous,
  next,
}: {
  previous: FooterLesson | null;
  next: FooterLesson | null;
}) {
  if (!previous && !next) return null;

  return (
    <nav
      aria-label="Lesson navigation"
      className="sticky bottom-0 z-10 border-t border-neutral-200 bg-white px-6 py-4 md:px-12"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="flex min-w-0 items-center gap-5">
          {previous && (
            <>
              <ButtonLink
                href={`/lessons/${previous.slug}`}
                variant="tertiary"
                onClick={() =>
                  captureEvent("lesson_navigated", {
                    direction: "previous",
                    lesson_path: `/lessons/${previous.slug}`,
                  })
                }
                iconPosition="leading"
                icon={<ArrowLeft className="h-4 w-4" strokeWidth={2} />}
              >
                Previous Lesson
              </ButtonLink>
              <div className="hidden min-w-0 md:block">
                <p className="truncate text-body text-neutral-500">
                  {previous.title}
                </p>
                <p className="mt-0.5 text-body text-neutral-500">
                  {previous.duration}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex min-w-0 items-center justify-end gap-5">
          {next && (
            <>
              <div className="hidden min-w-0 text-right md:block">
                <p className="truncate text-body text-neutral-500">
                  {next.title}
                </p>
                <p className="mt-0.5 text-body text-neutral-500">
                  {next.duration}
                </p>
              </div>
              <ButtonLink
                href={`/lessons/${next.slug}`}
                size="xl"
                onClick={() =>
                  captureEvent("lesson_navigated", {
                    direction: "next",
                    lesson_path: `/lessons/${next.slug}`,
                  })
                }
                icon={<ArrowRight className="h-5 w-5" strokeWidth={2} />}
              >
                Next Lesson
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
