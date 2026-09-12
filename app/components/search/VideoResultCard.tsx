"use client";

import Image from "next/image";
import { ChevronRight, Play, PlayCircle } from "lucide-react";

import type { VideoSearchResult } from "@/app/lib/search/schema";
import { formatTimestamp } from "@/sanity/lib/derive";
import { urlFor } from "@/sanity/lib/image";

import { AnalyticsLink } from "../ui/AnalyticsLink";
import { Badge } from "../ui/Badge";
import { CourseCover } from "../ui/CourseCover";

/**
 * A video result (design/vertex-search.png): a lesson's video matched at one
 * second, with the moment's thumbnail, its timecode, and an action that starts
 * playback there — on the lesson page, never at the provider (AGENTS.md §7).
 *
 * Every value is stored Sanity content the search route hydrated, and the
 * second was verified against the video document before it reached this card,
 * so nothing here can name a moment that does not exist (§11).
 */
export function VideoResultCard({
  result,
  query,
  rank,
}: {
  result: VideoSearchResult;
  query: string;
  rank: number;
}) {
  const href = `/lessons/${result.slug}?t=${result.startSeconds}`;
  const timecode = formatTimestamp(result.startSeconds);
  const eventProperties = {
    query,
    rank,
    result_type: "video",
    lesson_slug: result.slug,
    course_slug: result.courseSlug ?? null,
    start_seconds: result.startSeconds,
  };

  return (
    <article className="flex w-full flex-col gap-5 rounded-md border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-stretch">
      {/* Thumbnail */}
      <AnalyticsLink
        href={href}
        eventName="search_result_opened"
        eventProperties={eventProperties}
        aria-label={`Watch ${result.title} from ${timecode}`}
        className="group relative aspect-video w-full shrink-0 overflow-hidden rounded-sm bg-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-primary-400 sm:aspect-auto sm:h-auto sm:w-[276px]"
      >
        {result.posterAssetId ? (
          <Image
            src={urlFor(result.posterAssetId).width(552).height(310).fit("crop").url()}
            alt={result.posterAlt ?? ""}
            fill
            sizes="(min-width: 640px) 276px, 100vw"
            className="object-cover"
            placeholder={result.posterLqip ? "blur" : "empty"}
            blurDataURL={result.posterLqip ?? undefined}
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center font-display text-[3.5rem] leading-none font-bold text-white/90"
          >
            {result.title.charAt(0)}
          </span>
        )}

        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-md transition-transform group-hover:scale-105">
            <Play className="ml-0.5 h-5 w-5" strokeWidth={2} fill="currentColor" />
          </span>
        </span>

        {/* The matched second, the same value the action names. */}
        <span
          aria-hidden="true"
          className="absolute right-3 bottom-3 rounded-xs bg-neutral-900/80 px-2 py-1 text-small font-medium text-white"
        >
          {timecode}
        </span>
      </AnalyticsLink>

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
          <Badge variant="video">Video</Badge>
        </div>

        <h2 className="text-heading-2 font-semibold text-neutral-900">
          <AnalyticsLink
            href={href}
            eventName="search_result_opened"
            eventProperties={eventProperties}
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
          <span className="flex min-w-0 items-center gap-2 text-body text-neutral-500">
            {result.lessonLabel && (
              <span className="whitespace-nowrap">{result.lessonLabel}</span>
            )}
            {result.lessonLabel && result.moduleTitle && (
              <span aria-hidden="true">·</span>
            )}
            {result.moduleTitle && (
              <span className="truncate">{result.moduleTitle}</span>
            )}
          </span>

          <AnalyticsLink
            href={href}
            tabIndex={-1}
            aria-hidden="true"
            eventName="search_result_opened"
            eventProperties={eventProperties}
            className="inline-flex items-center gap-2 text-body font-semibold whitespace-nowrap text-primary-500 outline-none hover:text-primary-600"
          >
            <PlayCircle className="h-4 w-4" strokeWidth={2} />
            Watch from {timecode}
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </AnalyticsLink>
        </div>
      </div>
    </article>
  );
}
