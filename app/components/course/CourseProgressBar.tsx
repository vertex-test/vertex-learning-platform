"use client";

import { ArrowRight } from "lucide-react";
import { captureEvent } from "@/app/lib/posthog-client";
import { ButtonLink } from "../ui/Button";
import { ProgressBar } from "../ui/ProgressBar";

/**
 * The sticky bottom bar from design/vertex-course.png.
 *
 * Presentational for now: learner progress (AGENTS.md §7) has no document type
 * and no server route yet, so `percent` is 0 and the label reads as a zero
 * state rather than inventing a number. When progress lands, the page passes a
 * real percent and nothing here changes.
 */
export function CourseProgressBar({
  percent,
  continueHref,
  courseSlug,
}: {
  percent: number;
  continueHref: string | null;
  courseSlug: string | null;
}) {
  const started = percent > 0;

  return (
    <div className="sticky bottom-0 z-10 border-t border-neutral-200 bg-white px-6 py-4 md:px-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="shrink-0">
            <p className="text-small text-neutral-500">Your Progress</p>
            <p className="mt-1 text-body-lg text-neutral-500">
              <span className="font-semibold text-neutral-900">{percent}%</span>{" "}
              complete
            </p>
          </div>
          <div className="w-full sm:max-w-[280px]">
            <ProgressBar percent={percent} showLabel={false} />
          </div>
        </div>
        {continueHref && (
          <ButtonLink
            href={continueHref}
            size="xl"
            onClick={() =>
              captureEvent("learning_started", {
                course_slug: courseSlug,
                lesson_path: continueHref,
                current_percent: percent,
                // `started` is what the label says; once progress is stored
                // this becomes a real resume rather than a first visit.
                resumed: started,
              })
            }
            icon={<ArrowRight className="h-5 w-5" strokeWidth={2} />}
          >
            {started ? "Continue Learning" : "Start Learning"}
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
