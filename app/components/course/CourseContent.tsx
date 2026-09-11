"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { captureEvent } from "@/app/lib/posthog-client";

/**
 * The module accordion. The only client component on the course page
 * (AGENTS.md §5): it owns expand/collapse and the show-all toggle, and it
 * receives plain derived data — no Sanity client, no token.
 */

export interface ContentLesson {
  id: string;
  /** Derived from array order, e.g. "Lesson 5.1". */
  label: string;
  title: string;
  slug: string | null;
  duration: string;
  freePreview: boolean;
}

export interface ContentModule {
  key: string;
  /** Derived from array order. */
  number: number;
  title: string;
  summary: string;
  duration: string;
  lessons: ContentLesson[];
}

/** The reference collapses a long outline behind a show-all control. */
const COLLAPSED_MODULE_COUNT = 6;

export function CourseContent({ modules }: { modules: ContentModule[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const panelId = useId();

  const collapsible = modules.length > COLLAPSED_MODULE_COUNT;
  const visible =
    collapsible && !showAll ? modules.slice(0, COLLAPSED_MODULE_COUNT) : modules;

  return (
    <div className={collapsible ? "pb-6" : undefined}>
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        {visible.map((module, index) => {
          const isOpen = expanded === module.key;
          const bodyId = `${panelId}-${module.key}`;

          return (
            <div
              key={module.key}
              className={index > 0 ? "border-t border-neutral-200" : undefined}
            >
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={bodyId}
                  onClick={() => {
                    setExpanded(isOpen ? null : module.key);
                    captureEvent("course_module_toggled", {
                      action: isOpen ? "collapsed" : "expanded",
                      module_key: module.key,
                      module_number: module.number,
                      lesson_count: module.lessons.length,
                    });
                  }}
                  className="flex w-full items-center gap-5 px-6 py-4 text-left outline-none hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-inset md:px-8"
                >
                  <span className="relative flex shrink-0 items-center justify-center self-stretch">
                    {/* Connector between consecutive module markers. */}
                    {index > 0 && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1/2 left-1/2 h-[calc(50%+1rem)] w-px -translate-x-1/2 bg-neutral-200"
                      />
                    )}
                    {index < visible.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute top-1/2 left-1/2 h-[calc(50%+1rem)] w-px -translate-x-1/2 bg-neutral-200"
                      />
                    )}
                    <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-body font-medium text-neutral-700">
                      {module.number}
                    </span>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-body-lg font-semibold text-neutral-900">
                      {module.title}
                    </span>
                    <span className="mt-1 block text-body text-neutral-500">
                      {module.summary}
                    </span>
                  </span>

                  <span className="hidden text-body whitespace-nowrap text-neutral-500 sm:block">
                    {module.duration}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    strokeWidth={2}
                    className={`h-5 w-5 shrink-0 text-neutral-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </h3>

              <div id={bodyId} hidden={!isOpen}>
                <ul className="border-t border-neutral-100 px-6 py-2 md:px-8 md:pl-[4.75rem]">
                  {module.lessons.map((lesson) => (
                    <li
                      key={lesson.id}
                      className="border-b border-neutral-100 last:border-b-0"
                    >
                      <LessonRow lesson={lesson} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {collapsible && (
        <div className="-mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setShowAll((value) => !value);
              captureEvent("course_outline_toggled", {
                action: showAll ? "collapsed" : "expanded",
                module_count: modules.length,
              });
            }}
            className="inline-flex h-12 items-center gap-2 rounded-md border border-neutral-200 bg-white px-6 text-body font-medium text-neutral-900 shadow-sm outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
          >
            {showAll ? "Show fewer modules" : `Show all ${modules.length} modules`}
            <ChevronDown
              aria-hidden="true"
              strokeWidth={2}
              className={`h-4 w-4 transition-transform ${showAll ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      )}
    </div>
  );
}

function LessonRow({ lesson }: { lesson: ContentLesson }) {
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-small text-neutral-500">{lesson.label}</span>
        <span className="mt-0.5 block text-body text-neutral-900">
          {lesson.title}
        </span>
      </span>
      {lesson.freePreview && (
        <span className="rounded-xs bg-primary-100 px-2 py-1 text-small font-bold tracking-wider text-primary-500 uppercase">
          Free preview
        </span>
      )}
      <span className="text-body whitespace-nowrap text-neutral-500">
        {lesson.duration}
      </span>
    </>
  );

  if (!lesson.slug) {
    return <span className="flex items-center gap-4 py-3">{body}</span>;
  }

  return (
    <Link
      href={`/lessons/${lesson.slug}`}
      onClick={() =>
        captureEvent("lesson_selected", {
          lesson_path: `/lessons/${lesson.slug}`,
          lesson_label: lesson.label,
          free_preview: lesson.freePreview,
        })
      }
      className="flex items-center gap-4 rounded-sm py-3 outline-none hover:text-primary-500 focus-visible:ring-2 focus-visible:ring-primary-400"
    >
      {body}
    </Link>
  );
}
