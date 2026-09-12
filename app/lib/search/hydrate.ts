import "server-only";

import { courseOutline, findLesson } from "@/sanity/lib/derive";
import { sanityFetch } from "@/sanity/lib/fetch";
import { SEARCH_LESSONS_BY_IDS_QUERY } from "@/sanity/lib/queries";
import type { SEARCH_LESSONS_BY_IDS_QUERY_RESULT } from "@/sanity.types";

import type { AgentResults, LessonSearchResult } from "./schema";

/**
 * Turns the agent's ranked lesson ids into result cards built from stored data
 * (AGENTS.md §7, §11).
 *
 * Anything the agent named that does not resolve to a real published lesson is
 * dropped rather than rendered — a hallucinated id becomes a missing card, not
 * a fake one.
 */

/** An abuse ceiling on the hydration query, not a cap on results (§11). */
const MAX_IDS = 60;

type HydratedLesson = SEARCH_LESSONS_BY_IDS_QUERY_RESULT[number];

function toResult(lesson: HydratedLesson): LessonSearchResult | null {
  if (!lesson.slug || !lesson.title) return null;

  const course = lesson.course;
  // Module and lesson numbers come from array order, never from storage
  // (AGENTS.md §8) — the same derivation the lesson page uses.
  const outline = courseOutline(course?.modules);
  const placement = findLesson(outline, lesson.slug);

  return {
    kind: "lesson",
    lessonId: lesson._id,
    slug: lesson.slug,
    title: lesson.title,
    summary: lesson.summary ?? null,
    keyPoints: (lesson.keyPoints ?? []).filter(
      (point): point is string => typeof point === "string" && point !== "",
    ),
    durationSeconds: lesson.durationSeconds ?? null,
    courseTitle: course?.title ?? null,
    courseSlug: course?.slug ?? null,
    courseCoverAssetId: course?.coverImage?.asset?._id ?? null,
    courseCoverAlt: course?.coverImage?.alt ?? null,
    courseCoverLqip: course?.coverImage?.asset?.metadata?.lqip ?? null,
    moduleNumber: placement?.module.moduleNumber ?? null,
    moduleTitle: placement?.module.title ?? null,
    lessonLabel: placement?.lesson.label ?? null,
  };
}

export async function hydrateResults(
  agentResults: AgentResults,
): Promise<LessonSearchResult[]> {
  // De-duplicate before the query: a model that lists a lesson twice should not
  // produce two cards, and the ceiling should count distinct lessons.
  const ids = [
    ...new Set(
      agentResults.matches
        .map((match) => match.lessonId)
        .filter((id) => typeof id === "string" && id !== ""),
    ),
  ].slice(0, MAX_IDS);

  if (ids.length === 0) return [];

  const lessons: SEARCH_LESSONS_BY_IDS_QUERY_RESULT = await sanityFetch({
    query: SEARCH_LESSONS_BY_IDS_QUERY,
    params: { ids },
    tags: ["lesson", "course"],
  });

  const byId = new Map(lessons.map((lesson) => [lesson._id, lesson]));

  // GROQ returns document order; the agent's ranking is the order that matters.
  return ids
    .map((id) => byId.get(id))
    .filter((lesson): lesson is HydratedLesson => Boolean(lesson))
    .map(toResult)
    .filter((result): result is LessonSearchResult => Boolean(result));
}

/** Distinct courses across the results — the "across 8 courses" in the design. */
export function countCourses(results: LessonSearchResult[]): number {
  return new Set(
    results
      .map((result) => result.courseSlug)
      .filter((slug): slug is string => Boolean(slug)),
  ).size;
}
