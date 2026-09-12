import "server-only";

import { courseOutline, findLesson } from "@/sanity/lib/derive";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  SEARCH_LESSONS_BY_IDS_QUERY,
  SEARCH_VIDEO_MOMENTS_QUERY,
} from "@/sanity/lib/queries";
import type {
  SEARCH_LESSONS_BY_IDS_QUERY_RESULT,
  SEARCH_VIDEO_MOMENTS_QUERY_RESULT,
} from "@/sanity.types";

import type {
  AgentResults,
  LessonSearchResult,
  SearchResult,
  VideoSearchResult,
} from "./schema";

/**
 * Turns the agent's ranked matches into result cards built from stored data
 * (AGENTS.md §7, §11).
 *
 * Anything the agent named that does not resolve to a real published lesson is
 * dropped rather than rendered — a hallucinated id becomes a missing card, not
 * a fake one. A reported second that is not in the lesson's `video` document is
 * treated the same way: the match survives as a plain lesson card, never as a
 * video card pointing at an invented moment.
 */

/** An abuse ceiling on the hydration query, not a cap on results (§11). */
const MAX_IDS = 60;
/**
 * How far the agent's second may sit from a real chapter or chunk boundary
 * before we stop believing it names that moment. Wide enough to absorb a model
 * that rounds, narrow enough that it cannot land on a different topic.
 */
const SNAP_TOLERANCE_SECONDS = 2;
/**
 * One well-chaptered video should not fill the page. The design's list spans
 * courses ("across 8 courses"), so each lesson contributes at most this many
 * moments.
 */
const MAX_MOMENTS_PER_LESSON = 2;

type HydratedLesson = SEARCH_LESSONS_BY_IDS_QUERY_RESULT[number];
type VideoMoments = SEARCH_VIDEO_MOMENTS_QUERY_RESULT[number];

type ResolvedMoment = {
  startSeconds: number;
  matchedFrom: "chapter" | "transcript";
  /** The chapter's label, which titles the card. Null for a transcript hit. */
  label: string | null;
};

/** Everything both card kinds share, derived once per lesson. */
function baseResult(lesson: HydratedLesson) {
  const course = lesson.course;
  // Module and lesson numbers come from array order, never from storage
  // (AGENTS.md §8) — the same derivation the lesson page uses.
  const outline = courseOutline(course?.modules);
  const placement = lesson.slug ? findLesson(outline, lesson.slug) : null;

  return {
    lessonId: lesson._id,
    summary: lesson.summary ?? null,
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

function toLessonResult(lesson: HydratedLesson): LessonSearchResult | null {
  if (!lesson.slug || !lesson.title) return null;

  return {
    ...baseResult(lesson),
    kind: "lesson",
    slug: lesson.slug,
    title: lesson.title,
    keyPoints: (lesson.keyPoints ?? []).filter(
      (point): point is string => typeof point === "string" && point !== "",
    ),
  };
}

/**
 * The moment the agent's second actually names, or null when the data holds no
 * such moment.
 *
 * Chapters win over transcript chunks at equal distance: their labels are the
 * clean, human-written layer, and the transcript is the noisier backstop
 * (AGENTS.md §7).
 */
function resolveMoment(
  video: VideoMoments,
  reported: number,
): ResolvedMoment | null {
  let best: (ResolvedMoment & { distance: number }) | null = null;

  const consider = (candidate: ResolvedMoment & { distance: number }) => {
    if (candidate.distance > SNAP_TOLERANCE_SECONDS) return;
    if (!best || candidate.distance < best.distance) best = candidate;
  };

  for (const chapter of video.chapters ?? []) {
    if (typeof chapter.startSeconds !== "number") continue;
    consider({
      startSeconds: chapter.startSeconds,
      matchedFrom: "chapter",
      label: chapter.label ?? null,
      distance: Math.abs(chapter.startSeconds - reported),
    });
  }

  // Only if no chapter is close enough — the two-stage resolution of §7.
  if (best) return best;

  for (const seconds of video.chunkSeconds ?? []) {
    if (typeof seconds !== "number") continue;
    consider({
      startSeconds: seconds,
      matchedFrom: "transcript",
      label: null,
      distance: Math.abs(seconds - reported),
    });
  }

  return best;
}

function toVideoResult(
  lesson: HydratedLesson,
  moment: ResolvedMoment,
): VideoSearchResult | null {
  if (!lesson.slug || !lesson.title) return null;

  return {
    ...baseResult(lesson),
    kind: "video",
    slug: lesson.slug,
    // A chapter label is stored content and names the moment better than the
    // lesson does; a transcript hit has no clean label, so the lesson title
    // stands in rather than a sentence lifted out of the transcript.
    title: moment.label || lesson.title,
    startSeconds: moment.startSeconds,
    matchedFrom: moment.matchedFrom,
    posterAssetId: lesson.poster?.asset?._id ?? null,
    posterAlt: lesson.poster?.alt ?? null,
    posterLqip: lesson.poster?.asset?.metadata?.lqip ?? null,
  };
}

export async function hydrateResults(
  agentResults: AgentResults,
): Promise<SearchResult[]> {
  const matches = agentResults.matches.filter(
    (match) => typeof match.lessonId === "string" && match.lessonId !== "",
  );

  // De-duplicate before the query: the same lesson may legitimately appear as
  // both a moment and a lesson card, but it is fetched once.
  const ids = [...new Set(matches.map((match) => match.lessonId))];
  if (ids.length === 0) return [];

  // §11 wants every relevant result, so the ceiling is an abuse guard rather
  // than a page size — but it must not drop lessons silently, or the count the
  // learner reads would quietly disagree with what the agent found.
  if (ids.length > MAX_IDS) {
    console.warn(
      `[search] agent returned ${ids.length} lessons; hydrating the first ${MAX_IDS}`,
    );
    ids.length = MAX_IDS;
  }

  const lessons: SEARCH_LESSONS_BY_IDS_QUERY_RESULT = await sanityFetch({
    query: SEARCH_LESSONS_BY_IDS_QUERY,
    params: { ids },
    tags: ["lesson", "course"],
  });

  const byId = new Map(lessons.map((lesson) => [lesson._id, lesson]));

  // Only the lessons the agent reported a moment for need their video looked
  // up. Lessons link to a video by URL, not by reference (AGENTS.md §8).
  const urls = [
    ...new Set(
      matches
        .filter((match) => match.kind === "video")
        .map((match) => byId.get(match.lessonId)?.videoUrl)
        .filter((url): url is string => typeof url === "string" && url !== ""),
    ),
  ];

  const videos: SEARCH_VIDEO_MOMENTS_QUERY_RESULT = urls.length
    ? await sanityFetch({
        query: SEARCH_VIDEO_MOMENTS_QUERY,
        params: { urls },
        tags: ["video"],
      })
    : [];

  const videoByUrl = new Map(
    videos
      .filter((video): video is VideoMoments & { url: string } =>
        Boolean(video.url),
      )
      .map((video) => [video.url, video]),
  );

  const results: SearchResult[] = [];
  /** One card per lesson, kind and second. */
  const seen = new Set<string>();
  const momentsPerLesson = new Map<string, number>();

  // The agent's ranking is the order that matters; GROQ returned document order.
  for (const match of matches) {
    const lesson = byId.get(match.lessonId);
    if (!lesson) continue;

    let result: SearchResult | null = null;

    if (match.kind === "video") {
      const video = lesson.videoUrl
        ? videoByUrl.get(lesson.videoUrl)
        : undefined;
      const moment = video ? resolveMoment(video, match.startSeconds) : null;
      const taken = momentsPerLesson.get(match.lessonId) ?? 0;

      if (moment && taken < MAX_MOMENTS_PER_LESSON) {
        result = toVideoResult(lesson, moment);
      } else {
        // The data holds no such moment (or this lesson has contributed
        // enough): the match is still a real lesson, so it degrades to a
        // lesson card rather than to a made-up timestamp.
        result = toLessonResult(lesson);
      }
    } else {
      result = toLessonResult(lesson);
    }

    if (!result) continue;

    const key =
      result.kind === "video"
        ? `video:${result.lessonId}:${result.startSeconds}`
        : `lesson:${result.lessonId}`;
    if (seen.has(key)) continue;

    // Counted here rather than above, so a moment the agent reported twice
    // costs the lesson nothing and a later, distinct moment still fits.
    if (result.kind === "video") {
      momentsPerLesson.set(
        result.lessonId,
        (momentsPerLesson.get(result.lessonId) ?? 0) + 1,
      );
    }

    seen.add(key);
    results.push(result);
  }

  return results;
}

/** Distinct courses across the results — the "across 8 courses" in the design. */
export function countCourses(results: SearchResult[]): number {
  return new Set(
    results
      .map((result) => result.courseSlug)
      .filter((slug): slug is string => Boolean(slug)),
  ).size;
}
