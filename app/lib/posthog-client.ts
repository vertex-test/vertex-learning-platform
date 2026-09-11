"use client";

import posthog from "posthog-js";

export function captureEvent(
  eventName: string,
  properties?: Record<string, unknown>,
) {
  if (
    !process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ||
    !process.env.NEXT_PUBLIC_POSTHOG_HOST
  ) {
    return;
  }

  posthog.capture(eventName, properties);
}
