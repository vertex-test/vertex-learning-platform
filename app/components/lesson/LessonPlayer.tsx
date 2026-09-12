"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useWatchDepth } from "@/app/lib/analytics/watch-depth";
import { captureEvent } from "@/app/lib/posthog-client";
import { formatTimestamp } from "@/sanity/lib/derive";
import { parseStartSeconds, videoEmbed } from "@/sanity/lib/video";

/**
 * The lesson video, playing on Vertex itself (AGENTS.md §7).
 *
 * A poster facade over the provider's own embed: the poster shows until the
 * learner presses play, then the provider iframe mounts and its player owns
 * every control from there. That is deliberately *not* a custom player — it
 * keeps the provider chrome while avoiding a ~1MB player download on every
 * lesson view, and gives the play event one honest place to fire.
 *
 * It receives a plain video URL and poster fields, so no Sanity client and no
 * token cross the boundary (AGENTS.md §5).
 */

export interface LessonPlayerProps {
  videoUrl: string | null;
  posterUrl: string | null;
  posterAlt: string | null;
  posterLqip: string | null;
  title: string;
  durationSeconds: number | null;
  /** For the analytics events only. */
  lessonSlug: string | null;
  /** For the analytics events only. */
  courseSlug: string | null;
}

export function LessonPlayer(props: LessonPlayerProps) {
  // `useSearchParams` needs a Suspense boundary in a prerendered page; without
  // it the whole lesson route would have to opt into dynamic rendering.
  return (
    <Suspense fallback={<PlayerSurface {...props} startSeconds={0} />}>
      <PlayerWithStartTime {...props} />
    </Suspense>
  );
}

function PlayerWithStartTime(props: LessonPlayerProps) {
  const searchParams = useSearchParams();
  // Untrusted input: clamped to the lesson's own length before it reaches the
  // embed URL. Search results deep-link to a matched second this way.
  const startSeconds = parseStartSeconds(
    searchParams.get("t"),
    props.durationSeconds,
  );

  return <PlayerSurface {...props} startSeconds={startSeconds} />;
}

function PlayerSurface({
  videoUrl,
  posterUrl,
  posterAlt,
  posterLqip,
  title,
  durationSeconds,
  lessonSlug,
  courseSlug,
  startSeconds,
}: LessonPlayerProps & { startSeconds: number }) {
  const [playing, setPlaying] = useState(false);

  const embed = videoEmbed(videoUrl, {
    startSeconds,
    title: `${title} — lesson video`,
  });

  // Watch depth, as an elapsed-time estimate — see the hook for what that can
  // and cannot see (AGENTS.md §7).
  useWatchDepth(playing, {
    lessonSlug,
    courseSlug,
    provider: embed?.provider ?? null,
    durationSeconds,
  });

  /**
   * The one real resume affordance the product has today: arriving at a lesson
   * already positioned at a second, which is what a video search result links
   * to. Learner progress has no document type or write route yet (§7), so there
   * is no stored resume position to report alongside it.
   *
   * Fired on arrival rather than in a handler because the resume *is* the page
   * load — there is no click of our own to hang it on.
   */
  const resumeCaptured = useRef<string | null>(null);
  const resumeKey = `${lessonSlug}:${startSeconds}`;

  useEffect(() => {
    if (startSeconds <= 0) return;
    if (resumeCaptured.current === resumeKey) return;
    resumeCaptured.current = resumeKey;

    captureEvent("lesson_resume_used", {
      lesson_slug: lessonSlug,
      course_slug: courseSlug,
      start_seconds: startSeconds,
      percent_into_lesson:
        durationSeconds && durationSeconds > 0
          ? Math.round((startSeconds / durationSeconds) * 100)
          : null,
      source: "deep_link",
    });
    // `resumeKey` already encodes the lesson and the second.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeKey]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-900 shadow-md">
      {playing && embed ? (
        <iframe
          src={embed.src}
          title={embed.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <>
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={posterAlt ?? ""}
              fill
              sizes="(min-width: 1024px) 960px, 100vw"
              className="object-cover"
              placeholder={posterLqip ? "blur" : "empty"}
              blurDataURL={posterLqip ?? undefined}
              priority
            />
          ) : (
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center font-display text-[6rem] leading-none font-bold text-white/90"
            >
              {title.charAt(0)}
            </span>
          )}

          {embed ? (
            <button
              type="button"
              onClick={() => {
                setPlaying(true);
                captureEvent("lesson_video_played", {
                  lesson_slug: lessonSlug,
                  course_slug: courseSlug,
                  provider: embed.provider,
                  start_seconds: startSeconds,
                  duration_seconds: durationSeconds,
                  resumed: startSeconds > 0,
                });
              }}
              className="group absolute inset-0 flex items-center justify-center bg-neutral-900/25 outline-none transition-colors hover:bg-neutral-900/10 focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-inset"
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg transition-transform group-hover:scale-105">
                <Play
                  className="ml-1 h-8 w-8"
                  strokeWidth={2}
                  fill="currentColor"
                />
              </span>
              <span className="sr-only">
                {startSeconds > 0
                  ? `Play ${title} from ${formatTimestamp(startSeconds)}`
                  : `Play ${title}`}
              </span>
            </button>
          ) : (
            /* An unsupported or missing video URL. Say so rather than
               rendering an empty frame or guessing an embed (AGENTS.md §9). */
            <p className="absolute inset-x-0 bottom-0 bg-neutral-900/80 px-5 py-3 text-body text-white">
              This lesson&rsquo;s video is not available yet.
            </p>
          )}

          {startSeconds > 0 && embed && (
            <span className="absolute bottom-4 left-4 rounded-xs bg-neutral-900/80 px-2.5 py-1 text-small font-medium text-white">
              Starts at {formatTimestamp(startSeconds)}
            </span>
          )}
        </>
      )}
    </div>
  );
}
