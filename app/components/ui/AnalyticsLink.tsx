"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { captureEvent } from "@/app/lib/posthog-client";

type AnalyticsLinkProps = ComponentProps<typeof Link> & {
  eventName: string;
  eventProperties?: Record<string, unknown>;
};

export function AnalyticsLink({
  eventName,
  eventProperties,
  onClick,
  ...props
}: AnalyticsLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        captureEvent(eventName, eventProperties);
        onClick?.(event);
      }}
    />
  );
}
