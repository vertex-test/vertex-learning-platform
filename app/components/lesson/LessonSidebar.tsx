"use client";

import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import { captureEvent } from "@/app/lib/posthog-client";
import { CourseCover } from "../ui/CourseCover";
import { PlayCircleFilled } from "../ui/PlayCircleFilled";
import { ProgressBar } from "../ui/ProgressBar";

/**
 * The lesson page's course outline (design/vertex-lesson.png, left column).
 *
 * Top-level rows are modules, numbered from array order; the current lesson's
 * module starts expanded and lists its lessons (AGENTS.md §8 — no number is
 * stored). Receives plain derived data only, no Sanity client (AGENTS.md §5).
 */

export interface SidebarLesson {
  id: string;
  title: string;
  slug: string | null;
  duration: string;
  /** The lesson currently open. */
  current: boolean;
}

export interface SidebarModule {
  key: string;
  number: number;
  title: string;
  duration: string;
  lessons: SidebarLesson[];
}

export interface LessonSidebarProps {
  courseTitle: string;
  courseHref: string | null;
  coverAssetId: string | null;
  coverAlt: string | null;
  coverLqip: string | null;
  modules: SidebarModule[];
  /** 1-based position of the module holding the open lesson. */
  currentModuleNumber: number;
  /**
   * Zero until learner progress has a document type and a server write route
   * (AGENTS.md §7). Showing a made-up percentage would fabricate data.
   */
  percentComplete: number;
}

export function LessonSidebar({
  courseTitle,
  courseHref,
  coverAssetId,
  coverAlt,
  coverLqip,
  modules,
  currentModuleNumber,
  percentComplete,
}: LessonSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-200 px-6 py-5">
        {courseHref && (
          <Link
            href={courseHref}
            className="inline-flex items-center gap-2 text-body-lg font-medium text-primary-500 outline-none hover:text-primary-600 focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back to course
          </Link>
        )}

        <div className="mt-5 flex items-start gap-4">
          <CourseCover
            assetId={coverAssetId}
            alt={coverAlt}
            lqip={coverLqip}
            title={courseTitle}
            size={56}
            className="h-14 w-14"
          />
          <div className="min-w-0 flex-1">
            <p className="text-body-lg font-semibold text-neutral-900">
              {courseTitle}
            </p>
            <div className="mt-2">
              <ProgressBar percent={percentComplete} />
            </div>
          </div>
        </div>
      </div>

      <ModuleList
        modules={modules}
        currentModuleNumber={currentModuleNumber}
        moduleCount={modules.length}
      />
    </div>
  );
}

function ModuleList({
  modules,
  currentModuleNumber,
  moduleCount,
}: {
  modules: SidebarModule[];
  currentModuleNumber: number;
  moduleCount: number;
}) {
  const [expanded, setExpanded] = useState<string | null>(
    modules.find((module) => module.number === currentModuleNumber)?.key ??
      null,
  );
  // Below `lg` the outline sits above the lesson, so it starts collapsed
  // rather than pushing the content off-screen (AGENTS.md §3). From `lg` up
  // it is the fixed sidebar and `lg:block` keeps it open regardless.
  const [outlineOpen, setOutlineOpen] = useState(false);
  const panelId = useId();
  const outlineId = `${panelId}-outline`;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {/* From `lg` up the outline is always open, so the control is not a
          disclosure any more — it becomes plain text. Merely blocking the
          mouse there would leave it focusable and still flip `aria-expanded`,
          announcing a collapse that never happens. */}
      <button
        type="button"
        aria-expanded={outlineOpen}
        aria-controls={outlineId}
        onClick={() => setOutlineOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-2 px-6 py-4 text-left text-body-lg text-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-inset lg:hidden"
      >
        Module {currentModuleNumber} of {moduleCount}
        <ChevronDown
          aria-hidden="true"
          className={`h-5 w-5 text-neutral-500 transition-transform ${outlineOpen ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      <p className="hidden w-full items-center justify-between gap-2 px-6 py-4 text-body-lg text-neutral-900 lg:flex">
        Module {currentModuleNumber} of {moduleCount}
        <ChevronDown
          aria-hidden="true"
          className="h-5 w-5 text-neutral-500"
          strokeWidth={2}
        />
      </p>

      <ul id={outlineId} className={outlineOpen ? "block" : "hidden lg:block"}>
        {modules.map((module, index) => {
          const isOpen = expanded === module.key;
          const bodyId = `${panelId}-${module.key}`;
          const isCurrent = module.number === currentModuleNumber;

          return (
            <li
              key={module.key}
              className={`border-t border-neutral-200 ${isCurrent ? "bg-neutral-50" : ""}`}
            >
              <h2>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={bodyId}
                  onClick={() => {
                    setExpanded(isOpen ? null : module.key);
                    captureEvent("lesson_module_toggled", {
                      action: isOpen ? "collapsed" : "expanded",
                      module_number: module.number,
                      lesson_count: module.lessons.length,
                    });
                  }}
                  className="flex w-full items-center gap-4 px-6 py-4 text-left outline-none hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-inset"
                >
                  <span className="relative flex shrink-0 items-center justify-center self-stretch">
                    {/* Connector between consecutive module markers, as on the
                        course page outline. */}
                    {index > 0 && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1/2 left-1/2 h-[calc(50%+1rem)] w-px -translate-x-1/2 bg-neutral-200"
                      />
                    )}
                    {index < modules.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute top-1/2 left-1/2 h-[calc(50%+1rem)] w-px -translate-x-1/2 bg-neutral-200"
                      />
                    )}
                    <span
                      className={`relative flex h-8 w-8 items-center justify-center rounded-full border text-body font-medium ${
                        isCurrent
                          ? "border-primary-500 bg-primary-500 text-white"
                          : "border-neutral-200 bg-white text-neutral-700"
                      }`}
                    >
                      {module.number}
                    </span>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-body font-medium text-neutral-900">
                      {module.title}
                    </span>
                    <span className="mt-0.5 block text-small text-neutral-500">
                      {module.duration}
                    </span>
                  </span>

                  <ChevronDown
                    aria-hidden="true"
                    strokeWidth={2}
                    className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </h2>

              <div id={bodyId} hidden={!isOpen}>
                <ul className="pb-3 pl-[3.75rem] pr-6">
                  {module.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <LessonRow lesson={lesson} moduleNumber={module.number} />
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LessonRow({
  lesson,
  moduleNumber,
}: {
  lesson: SidebarLesson;
  moduleNumber: number;
}) {
  const body = (
    <>
      <span className="relative flex shrink-0 items-center self-stretch pt-1.5">
        <span
          aria-hidden="true"
          className={`h-2 w-2 rounded-full ${
            lesson.current
              ? "bg-primary-500"
              : "border border-neutral-300 bg-white"
          }`}
        />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block text-body ${lesson.current ? "font-medium text-neutral-900" : "text-neutral-700"}`}
        >
          {lesson.title}
        </span>
        <span
          className={`mt-0.5 block text-small ${lesson.current ? "text-primary-500" : "text-neutral-500"}`}
        >
          {lesson.current ? "Now playing" : lesson.duration}
        </span>
      </span>

      {lesson.current && (
        <span className="shrink-0 text-primary-500">
          <PlayCircleFilled />
        </span>
      )}
    </>
  );

  if (lesson.current) {
    return (
      <span aria-current="true" className="flex gap-3 py-2.5">
        {body}
      </span>
    );
  }

  if (!lesson.slug) {
    return <span className="flex gap-3 py-2.5">{body}</span>;
  }

  return (
    <Link
      href={`/lessons/${lesson.slug}`}
      onClick={() =>
        captureEvent("lesson_selected", {
          lesson_path: `/lessons/${lesson.slug}`,
          module_number: moduleNumber,
          source: "lesson_sidebar",
        })
      }
      className="flex gap-3 rounded-sm py-2.5 outline-none hover:text-primary-500 focus-visible:ring-2 focus-visible:ring-primary-400"
    >
      {body}
    </Link>
  );
}
