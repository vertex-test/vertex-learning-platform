"use client";

import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";

export function PostHogIdentity() {
  const { isLoaded, isSignedIn, user } = useUser();
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (
      !isLoaded ||
      !process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ||
      !process.env.NEXT_PUBLIC_POSTHOG_HOST
    ) {
      return;
    }

    if (isSignedIn && user) {
      if (identifiedUserId.current && identifiedUserId.current !== user.id) {
        posthog.reset();
      }

      // The Clerk user id and nothing else: no email, no name, no other
      // personally identifiable property reaches PostHog, on the person record
      // or on any event.
      posthog.identify(user.id);
      identifiedUserId.current = user.id;
      return;
    }

    if (identifiedUserId.current) {
      posthog.reset();
      identifiedUserId.current = null;
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}
