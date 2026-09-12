import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Bookmark, ChartNoAxesColumn, CircleCheck, Clock, Lightbulb, Users } from "lucide-react";
import type { ReactNode } from "react";

import {
  LESSON_BY_SLUG_QUERY,
  LESSON_COURSE_CONTEXT_QUERY,
  LESSON_SLUGS_QUERY,
} from "@/sanity/lib/queries";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  courseOutline,
  findLesson,
  formatCount,
  formatDuration,
  formatLevel,
} from "@/sanity/lib/derive";
import { urlFor } from "@/sanity/lib/image";
import type {
  LESSON_BY_SLUG_QUERY_RESULT,
  LESSON_COURSE_CONTEXT_QUERY_RESULT,
  LESSON_SLUGS_QUERY_RESULT,
} from "@/sanity.types";

import { SiteHeader } from "@/app/components/SiteHeader";
import { PortableTextBody } from "@/app/components/PortableTextBody";
import {
  LessonFooterNav,
  type FooterLesson,
} from "@/app/components/lesson/LessonFooterNav";
import { LessonPlayer } from "@/app/components/lesson/LessonPlayer";
import {
  LessonResources,
  type LessonResource,
} from "@/app/components/lesson/LessonResources";
import {
  LessonSidebar,
  type SidebarModule,
} from "@/app/components/lesson/LessonSidebar";
import { LessonTabs } from "@/app/components/lesson/LessonTabs";
import { Badge } from "@/app/components/ui/Badge";
import { Breadcrumbs } from "@/app/components/ui/Breadcrumbs";
import { Button } from "@/app/components/ui/Button";
import { ViewTracker } from "@/app/components/ui/ViewTracker";

type Lesson = NonNullable<LESSON_BY_SLUG_QUERY_RESULT>;

/** The neighbour shape `findLesson` hands back for the prev/next bar. */
type NeighbourLesson = {
  title: string | null;
  slug: string | null;
  durationSeconds: number | null;
};

async function getLesson(slug: string): Promise<LESSON_BY_SLUG_QUERY_RESULT> {
  return sanityFetch({
    query: LESSON_BY_SLUG_QUERY,
    params: { slug },
    tags: ["lesson", `lesson:${slug}`],
  });
}

/**
 * A lesson stores no parent course (AGENTS.md §8), so the course — and with it
 * the sidebar, the breadcrumbs, the derived "Lesson 5.1" label and prev/next —
 * comes from a reverse reference.
 */
async function getCourseContext(
  lessonId: string,
): Promise<LESSON_COURSE_CONTEXT_QUERY_RESULT> {
  return sanityFetch({
    query: LESSON_COURSE_CONTEXT_QUERY,
    params: { lessonId },
    tags: ["course", "lesson"],
  });
}

export async function generateStaticParams() {
  const slugs: LESSON_SLUGS_QUERY_RESULT = await sanityFetch({
    query: LESSON_SLUGS_QUERY,
    tags: ["lesson"],
  });

  return slugs
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/lessons/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const lesson = await getLesson(slug);

  if (!lesson) return { title: "Lesson not found" };

  return {
    // `title` is nullable in TypeGen (required is enforced in the Studio, not
    // in the type system), and the same fallback is used in the heading below.
    title: `${lesson.title ?? "Lesson"} — Vertex`,
    description: lesson.summary ?? undefined,
  };
}

export default async function LessonPage(props: PageProps<"/lessons/[slug]">) {
  const { slug } = await props.params;
  const lesson = await getLesson(slug);

  if (!lesson) notFound();

  const course = await getCourseContext(lesson._id);

  // Module and lesson numbers come from array order, never from storage
  // (AGENTS.md §8).
  const outline = courseOutline(course?.modules);
  const placement = findLesson(outline, slug);

  const sidebarModules: SidebarModule[] = outline.modules.map((module) => ({
    key: module._key,
    number: module.moduleNumber,
    title: module.title ?? "",
    duration: formatDuration(module.durationSeconds),
    lessons: module.lessons.map((outlineLesson) => ({
      id: outlineLesson._id,
      title: outlineLesson.title ?? "",
      slug: outlineLesson.slug,
      duration: formatDuration(outlineLesson.durationSeconds),
      current: outlineLesson.slug === slug,
    })),
  }));

  /** Either end is omitted at the start and end of the course. */
  const footerLesson = (
    entry: NeighbourLesson | null | undefined,
  ): FooterLesson | null =>
    entry?.slug
      ? {
          title: entry.title ?? "",
          slug: entry.slug,
          duration: formatDuration(entry.durationSeconds),
        }
      : null;

  const resources: LessonResource[] = (lesson.resources ?? []).flatMap(
    (resource) =>
      resource.url && resource.title
        ? [
            {
              key: resource._key,
              type: resource.type ?? null,
              title: resource.title,
              description: resource.description ?? null,
              url: resource.url,
            },
          ]
        : [],
  );

  const courseHref = course?.slug ? `/courses/${course.slug}` : null;
  const posterAssetId = lesson.poster?.asset?._id ?? null;

  return (
    <div className="page-hatch flex flex-1 flex-col bg-canvas sm:px-8">
      <div className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col bg-canvas sm:border-x sm:border-neutral-200">
        <SiteHeader activeHref="/courses" />

        <ViewTracker
          eventName="lesson_viewed"
          properties={{
            lesson_slug: slug,
            lesson_label: placement?.lesson.label ?? null,
            course_slug: course?.slug ?? null,
            module_number: placement?.module.moduleNumber ?? null,
            free_preview: Boolean(lesson.freePreview),
          }}
        />

        <div className="flex flex-1 flex-col lg:flex-row">
          {course && (
            <aside className="shrink-0 border-b border-neutral-200 bg-white lg:sticky lg:top-0 lg:max-h-screen lg:w-[310px] lg:self-start lg:border-b-0 lg:border-r">
              <LessonSidebar
                courseTitle={course.title ?? ""}
                courseHref={courseHref}
                coverAssetId={course.coverImage?.asset?._id ?? null}
                coverAlt={course.coverImage?.alt ?? null}
                coverLqip={course.coverImage?.asset?.metadata?.lqip ?? null}
                modules={sidebarModules}
                currentModuleNumber={placement?.module.moduleNumber ?? 1}
                /* Zero until learner progress has a document type and a server
                   write route (AGENTS.md §7) — a made-up percentage would be
                   fabricated data on an otherwise grounded page. */
                percentComplete={0}
              />
            </aside>
          )}

          <main className="min-w-0 flex-1 px-6 pt-8 pb-12 md:px-12">
            <Breadcrumbs
              items={[
                { label: "All Courses", href: "/courses" },
                ...(course?.title
                  ? [{ label: course.title, href: courseHref ?? undefined }]
                  : []),
                ...(placement?.module.title
                  ? [{ label: placement.module.title }]
                  : []),
                { label: lesson.title ?? "Lesson" },
              ]}
            />

            <LessonHeader
              lesson={lesson}
              label={placement?.lesson.label ?? null}
              level={formatLevel(course?.level)}
            />

            <div className="mt-8">
              <LessonPlayer
                videoUrl={lesson.videoUrl ?? null}
                posterUrl={
                  posterAssetId
                    ? urlFor(posterAssetId).width(1920).height(1080).fit("crop").url()
                    : null
                }
                posterAlt={lesson.poster?.alt ?? null}
                posterLqip={lesson.poster?.asset?.metadata?.lqip ?? null}
                title={lesson.title ?? "Lesson"}
                durationSeconds={lesson.durationSeconds ?? null}
                lessonSlug={slug}
              />
            </div>

            <div className="mt-10">
              <LessonTabs
                lessonSlug={slug}
                content={
                  <div className="space-y-8">
                    {lesson.notes && lesson.notes.length > 0 && (
                      <section>
                        <h3 className="text-heading-2 font-semibold text-neutral-900">
                          Overview
                        </h3>
                        <div className="mt-4">
                          <PortableTextBody value={lesson.notes} />
                        </div>
                      </section>
                    )}

                    {lesson.keyPoints && lesson.keyPoints.length > 0 && (
                      <section className="border-t border-neutral-200 pt-8">
                        <h3 className="text-heading-3 font-semibold text-neutral-900">
                          In this lesson you will:
                        </h3>
                        <ul className="mt-5 space-y-4">
                          {lesson.keyPoints.map((point) => (
                            <li
                              key={point}
                              className="flex items-start gap-3 text-body-lg text-neutral-700"
                            >
                              <CircleCheck
                                aria-hidden="true"
                                className="mt-0.5 h-5 w-5 shrink-0 text-primary-500"
                                strokeWidth={2}
                              />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {lesson.proTip && (
                      <section className="flex items-start gap-4 rounded-md bg-primary-100 p-6">
                        <Lightbulb
                          aria-hidden="true"
                          className="mt-0.5 h-5 w-5 shrink-0 text-primary-500"
                          strokeWidth={2}
                        />
                        <div className="min-w-0">
                          <h3 className="text-heading-3 font-semibold text-neutral-900">
                            Pro Tip
                          </h3>
                          <p className="mt-2 text-body-lg leading-7 text-neutral-700">
                            {lesson.proTip}
                          </p>
                        </div>
                      </section>
                    )}

                    <LessonResources resources={resources} />
                  </div>
                }
              />
            </div>
          </main>
        </div>

        <LessonFooterNav
          previous={footerLesson(placement?.previous ?? null)}
          next={footerLesson(placement?.next ?? null)}
        />
      </div>
    </div>
  );
}

function LessonHeader({
  lesson,
  label,
  level,
}: {
  lesson: Lesson;
  label: string | null;
  level: string;
}) {
  return (
    <header className="mt-8">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          {label && <Badge variant="video">{label}</Badge>}

          <h1
            className={`font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.12] font-bold text-neutral-900 ${label ? "mt-4" : ""}`}
          >
            {lesson.title ?? "Lesson"}
          </h1>

          <p className="mt-4 max-w-[60ch] text-body-lg text-neutral-700">
            {lesson.summary}
          </p>
        </div>

        {/* Presentational only, like the notifications bell (AGENTS.md §7). */}
        <Button
          variant="tertiary"
          aria-label="Bookmark this lesson"
          aria-disabled="true"
          className="h-11 w-11 shrink-0 px-0"
          iconPosition="leading"
          icon={<Bookmark className="h-5 w-5" strokeWidth={1.75} />}
        >
          <span className="sr-only">Bookmark</span>
        </Button>
      </div>

      <ul className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
        <Meta icon={<Clock className="h-4 w-4" strokeWidth={2} />}>
          {formatDuration(lesson.durationSeconds)}
        </Meta>
        {level && (
          <Meta icon={<ChartNoAxesColumn className="h-4 w-4" strokeWidth={2} />}>
            {level}
          </Meta>
        )}
        {lesson.studentCount != null && (
          <Meta icon={<Users className="h-4 w-4" strokeWidth={2} />}>
            {formatCount(lesson.studentCount)} students
          </Meta>
        )}
        {lesson.freePreview && (
          <li>
            <span className="rounded-xs bg-primary-100 px-2 py-1 text-small font-bold tracking-wider text-primary-500 uppercase">
              Free preview
            </span>
          </li>
        )}
      </ul>
    </header>
  );
}

function Meta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="inline-flex items-center gap-2 text-body whitespace-nowrap text-neutral-700">
      <span aria-hidden="true" className="text-neutral-500">
        {icon}
      </span>
      {children}
    </li>
  );
}
