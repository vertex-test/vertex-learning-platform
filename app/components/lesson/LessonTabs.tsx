"use client";

import { useId, useRef, useState, type ReactNode } from "react";

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
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});

  /** Selects a tab and moves focus with it, as a tablist is expected to. */
  function selectTab(id: TabId) {
    setActive(id);
    tabRefs.current[id]?.focus();
    captureEvent("lesson_tab_selected", {tab: id, lesson_slug: lessonSlug});
  }

  /**
   * `role="tablist"` promises arrow-key navigation, and a roving tabindex so
   * Tab moves past the tablist rather than through every tab.
   * https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
   */
  function onTabKeyDown(event: React.KeyboardEvent, index: number) {
    const last = tabs.length - 1;
    let next: number | null = null;

    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;

    if (next === null) return;
    event.preventDefault();
    selectTab(tabs[next].id);
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Lesson"
        className="flex items-center gap-8 border-b border-neutral-200"
      >
        {tabs.map((tab, index) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              id={`${baseId}-tab-${tab.id}`}
              ref={(node) => {
                tabRefs.current[tab.id] = node;
              }}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              onClick={() => selectTab(tab.id)}
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
