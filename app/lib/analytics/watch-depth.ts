"use client";

import { useEffect } from "react";

import { captureEvent } from "@/app/lib/posthog-client";

/**
 * Watch depth for the lesson video (AGENTS.md §7 — how far a video is watched).
 *
 * The player is a provider embed with no JS API wired up, so depth is measured
 * as elapsed wall-clock time from the play click, paused while the tab is
 * hidden and clamped to the lesson's stored duration. That makes it an
 * *estimate*: it cannot see a pause, a seek or a stall inside the provider's
 * own player, and it will over-report a learner who walks away with the tab in
 * front. Every event it emits says so with `estimated: true`.
 */

/** The milestones, ascending. 95 doubles as the completion threshold. */
const MILESTONES = [25, 50, 75, 95] as const;
const COMPLETION_PERCENT = 95;
const TICK_MS = 1000;

export type WatchDepthContext = {
  lessonSlug: string | null;
  courseSlug: string | null;
  provider: string | null;
  durationSeconds: number | null;
};

/**
 * Runs the heartbeat while `playing` is true.
 *
 * A timer is an external system, which is what `useEffect` is for — the events
 * themselves are derived inside the tick rather than from React state.
 *
 * The effect owns the counter and the set of milestones already sent, so a
 * client-side navigation to another lesson starts both over, and nothing is
 * read or written during render.
 */
export function useWatchDepth(playing: boolean, context: WatchDepthContext) {
  const { lessonSlug, courseSlug, provider, durationSeconds } = context;

  useEffect(() => {
    // Without a duration there is no denominator, so there is no honest
    // percentage to report and the timer would only burn cycles.
    if (!playing || !durationSeconds || durationSeconds <= 0) return;

    const sent = new Set<number>();
    /**
     * Depth is what was *watched*, so it starts at nothing even when the embed
     * was deep-linked into the middle of the video. Seeding it with the start
     * second would report a learner who arrived at 95% and watched one second
     * as having watched the whole lesson.
     */
    let watchedSeconds = 0;

    const interval = window.setInterval(() => {
      // A hidden tab is not playback the learner is watching. This is the one
      // stall the estimate can actually see.
      if (document.hidden) return;

      watchedSeconds = Math.min(
        watchedSeconds + TICK_MS / 1000,
        durationSeconds,
      );
      const percent = (watchedSeconds / durationSeconds) * 100;

      for (const milestone of MILESTONES) {
        if (percent < milestone || sent.has(milestone)) continue;
        sent.add(milestone);

        captureEvent("lesson_video_progressed", {
          lesson_slug: lessonSlug,
          course_slug: courseSlug,
          provider,
          percent_watched: milestone,
          watched_seconds: Math.round(watchedSeconds),
          duration_seconds: durationSeconds,
          estimated: true,
        });

        if (milestone === COMPLETION_PERCENT) {
          // No progress document type and no write route exist yet (§7), so
          // completion is a watch signal rather than a stored fact.
          captureEvent("lesson_completed", {
            lesson_slug: lessonSlug,
            course_slug: courseSlug,
            duration_seconds: durationSeconds,
            source: "video_watched",
            estimated: true,
          });
        }
      }

      // Everything worth reporting has been reported.
      if (sent.size === MILESTONES.length) window.clearInterval(interval);
    }, TICK_MS);

    return () => window.clearInterval(interval);
  }, [playing, lessonSlug, courseSlug, provider, durationSeconds]);
}
