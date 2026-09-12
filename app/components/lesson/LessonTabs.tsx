"use client";

import { useId, useState, type ReactNode } from "react";

import { captureEvent } from "@/app/lib/posthog-client";

/**
 * The Lesson Content / Notes tabs (design/vertex-lesson.png).
 *
 * The Notes tab is presentational — a learner notes feature has no backend
 * (AGENTS.md §7), so it shows an empty state rather than borrowed content.
 * The panels are rendered by the server and passed in as children, so the
 * lesson content itself stays a server component.
 */

type TabId = "content" | "notes";

const tabs: { id: TabId; label: string }[] = [
  { id: "content", label: "Lesson Content" },
  { id: "notes", label: "Notes" },
];

export function LessonTabs({
  content,
  lessonSlug,
}: {
  content: ReactNode;
  lessonSlug: string | null;
}) {
  const [active, setActive] = useState<TabId>("content");
  const baseId = useId();

  return (
    <div>
      <div
        role="tablist"
        aria-label="Lesson"
        className="flex items-center gap-8 border-b border-neutral-200"
      >
        {tabs.map((tab) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              id={`${baseId}-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              onClick={() => {
                setActive(tab.id);
                captureEvent("lesson_tab_selected", {
                  tab: tab.id,
                  lesson_slug: lessonSlug,
                });
              }}
              className={`-mb-px border-b-2 px-1 pb-3 text-body-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-400 ${
                selected
                  ? "border-primary-500 font-medium text-primary-500"
                  : "border-transparent text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-content`}
        aria-labelledby={`${baseId}-tab-content`}
        hidden={active !== "content"}
        className="pt-8"
      >
        {content}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-notes`}
        aria-labelledby={`${baseId}-tab-notes`}
        hidden={active !== "notes"}
        className="pt-8"
      >
        <p className="text-body-lg text-neutral-500">
          Your notes for this lesson will appear here.
        </p>
      </div>
    </div>
  );
}
