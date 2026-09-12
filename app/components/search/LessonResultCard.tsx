"use client";

import { ChevronRight, ExternalLink, FileText } from "lucide-react";

import type { LessonSearchResult } from "@/app/lib/search/schema";

import { AnalyticsLink } from "../ui/AnalyticsLink";
import { Badge } from "../ui/Badge";
import { CourseCover } from "../ui/CourseCover";

/**
 * A lesson result (design/vertex-search.png): the lesson's key points on a
 * tinted tile, the course it belongs to, and an action that opens the lesson.
 *
 * Every value here is stored Sanity content hydrated by the search route — the
 * model chose the lesson and its rank, never the copy (AGENTS.md §7, §11).
 */
export function LessonResultCard({
  result,
  query,
  rank,
}: {
  result: LessonSearchResult;
  query: string;
  rank: number;
}) {
  const href = `/lessons/${result.slug}`;

  return (
    <article className="flex w-full flex-col gap-5 rounded-md border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-stretch">
      {/* Key points tile */}
      <div className="relative flex w-full shrink-0 flex-col justify-center gap-2 overflow-hidden rounded-sm bg-neutral-100 p-5 sm:w-[276px]">
        <FileText
          aria-hidden="true"
          className="h-5 w-5 text-neutral-500"
          strokeWidth={1.75}
        />
        {result.keyPoints.length > 0 ? (
          <ul className="mt-1 space-y-2">
            {result.keyPoints.slice(0, 3).map((point) => (
              <li
                key={point}
                className="flex gap-2 text-body text-neutral-700"
              >
                <span aria-hidden="true" className="text-neutral-500">
                  •
                </span>
                <span className="line-clamp-1">{point}</span>
              </li>
            ))}
          </ul>
        ) : (
          // No key points authored — the tile stays a tile rather than
          // inventing bullets.
          <p className="mt-1 line-clamp-3 text-body text-neutral-500">
            {result.summary}
          </p>
        )}
      </div>

      {/* Result body */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 py-1 sm:pr-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <CourseCover
              assetId={result.courseCoverAssetId}
              alt={result.courseCoverAlt}
              lqip={result.courseCoverLqip}
              title={result.courseTitle}
              size={24}
              className="h-6 w-6 rounded-xs"
            />
            <span className="truncate text-body text-neutral-700">
              {result.courseTitle}
            </span>
          </div>
          <Badge variant="lesson">Lesson</Badge>
        </div>

        <h2 className="text-heading-2 font-semibold text-neutral-900">
          <AnalyticsLink
            href={href}
            eventName="search_result_clicked"
            eventProperties={{
              query,
              rank,
              lessonSlug: result.slug,
              resultKind: "lesson",
            }}
            className="outline-none hover:text-primary-500 focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            {result.title}
          </AnalyticsLink>
        </h2>

        {result.summary && (
          <p className="text-body text-neutral-500">{result.summary}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-2">
          {/* Derived from array order, never stored (AGENTS.md §8). */}
          <span className="text-body text-neutral-500">
            {result.moduleNumber ? `Module ${result.moduleNumber}` : ""}
          </span>
          <AnalyticsLink
            href={href}
            tabIndex={-1}
            aria-hidden="true"
            eventName="search_result_clicked"
            eventProperties={{
              query,
              rank,
              lessonSlug: result.slug,
              resultKind: "lesson",
            }}
            className="inline-flex items-center gap-2 text-body font-semibold whitespace-nowrap text-neutral-900 outline-none hover:text-primary-500"
          >
            View lesson
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
            <ChevronRight className="h-4 w-4 text-neutral-500" strokeWidth={2} />
          </AnalyticsLink>
        </div>
      </div>
    </article>
  );
}
