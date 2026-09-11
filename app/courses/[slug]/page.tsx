import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowRight,
  Bookmark,
  ChartNoAxesColumn,
  Clock,
  Folder,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import { COURSE_BY_SLUG_QUERY, COURSE_SLUGS_QUERY } from "@/sanity/lib/queries";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  courseOutline,
  formatCompactCount,
  formatDuration,
  formatLevel,
} from "@/sanity/lib/derive";
import type {
  COURSE_BY_SLUG_QUERY_RESULT,
  COURSE_SLUGS_QUERY_RESULT,
} from "@/sanity.types";

import { SiteHeader } from "@/app/components/SiteHeader";
import {
  CourseContent,
  type ContentModule,
} from "@/app/components/course/CourseContent";
import { CourseProgressBar } from "@/app/components/course/CourseProgressBar";
import { Badge } from "@/app/components/ui/Badge";
import { Breadcrumbs } from "@/app/components/ui/Breadcrumbs";
import { Button, ButtonLink } from "@/app/components/ui/Button";
import { CourseCover } from "@/app/components/ui/CourseCover";
import { OutcomeIcon } from "@/app/components/ui/OutcomeIcon";

type Course = NonNullable<COURSE_BY_SLUG_QUERY_RESULT>;

async function getCourse(slug: string): Promise<COURSE_BY_SLUG_QUERY_RESULT> {
  return sanityFetch({
    query: COURSE_BY_SLUG_QUERY,
    params: { slug },
    tags: ["course", `course:${slug}`],
  });
}

export async function generateStaticParams() {
  const slugs: COURSE_SLUGS_QUERY_RESULT = await sanityFetch({
    query: COURSE_SLUGS_QUERY,
    tags: ["course"],
  });

  return slugs
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/courses/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const course = await getCourse(slug);

  if (!course) return { title: "Course not found" };

  return {
    title: `${course.title} — Vertex`,
    description: course.summary ?? undefined,
  };
}

export default async function CoursePage(props: PageProps<"/courses/[slug]">) {
  const { slug } = await props.params;
  const course = await getCourse(slug);

  if (!course) notFound();

  // Module and lesson numbers and every duration are derived from array order
  // and the lessons themselves — Sanity stores none of them (AGENTS.md §8).
  const outline = courseOutline(course.modules);
  const firstLesson = outline.modules[0]?.lessons[0] ?? null;

  const modules: ContentModule[] = outline.modules.map((module) => ({
    key: module._key,
    number: module.moduleNumber,
    title: module.title ?? "",
    summary: module.summary ?? "",
    duration: formatDuration(module.durationSeconds),
    lessons: module.lessons.map((lesson) => ({
      id: lesson._id,
      label: lesson.label,
      title: lesson.title ?? "",
      slug: lesson.slug,
      duration: formatDuration(lesson.durationSeconds),
      freePreview: Boolean(lesson.freePreview),
    })),
  }));

  const moduleCount = course.moduleCount ?? outline.moduleCount;
  const totalDuration = formatDuration(
    course.totalDurationSeconds ?? outline.durationSeconds,
  );
  const continueHref = firstLesson?.slug ? `/lessons/${firstLesson.slug}` : null;

  return (
    <div className="page-hatch flex flex-1 flex-col bg-canvas sm:px-8">
      <div className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col bg-canvas sm:border-x sm:border-neutral-200">
        <SiteHeader activeHref="/courses" />

        <main className="flex-1 px-6 pt-8 pb-12 md:px-12">
          <Breadcrumbs
            items={[
              { label: "All Courses", href: "/courses" },
              { label: course.title ?? "Course" },
            ]}
          />

          <CourseHero
            course={course}
            level={formatLevel(course.level)}
            totalDuration={totalDuration}
            moduleCount={moduleCount}
            continueHref={continueHref}
          />

          {course.outcomes && course.outcomes.length > 0 && (
            <section className="mt-12 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm md:mt-16 md:p-10">
              <h2 className="font-display text-heading-1 font-bold text-neutral-900">
                What you&rsquo;ll learn
              </h2>
              <ul className="mt-6 grid gap-5 md:grid-cols-2">
                {course.outcomes.map((outcome) => (
                  <li
                    key={outcome._key}
                    className="flex items-start gap-5 rounded-md border border-neutral-200 bg-white p-5 md:p-6"
                  >
                    <OutcomeIcon name={outcome.icon} className="h-10 w-10" />
                    <div className="min-w-0">
                      <h3 className="text-heading-3 font-semibold text-neutral-900">
                        {outcome.title}
                      </h3>
                      <p className="mt-2 text-body text-neutral-500">
                        {outcome.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-12 md:mt-16">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <h2 className="font-display text-heading-1 font-bold text-neutral-900">
                Course Content
              </h2>
              <p className="text-body text-neutral-500">
                {moduleCount} {moduleCount === 1 ? "module" : "modules"}
                <span aria-hidden="true"> &nbsp;&bull;&nbsp; </span>
                {totalDuration}
              </p>
            </div>
            <div className="mt-5">
              <CourseContent modules={modules} />
            </div>
          </section>
        </main>

        <CourseProgressBar
          /* Zero until learner progress (AGENTS.md §7) has a document type and
             a server write route. Showing a made-up percentage would be
             fabricated data on an otherwise fully grounded page. */
          percent={0}
          continueHref={continueHref}
        />
      </div>
    </div>
  );
}

function CourseHero({
  course,
  level,
  totalDuration,
  moduleCount,
  continueHref,
}: {
  course: Course;
  level: string;
  totalDuration: string;
  moduleCount: number;
  continueHref: string | null;
}) {
  return (
    <section className="mt-8 flex flex-col gap-8 lg:flex-row lg:gap-12">
      <CourseCover
        assetId={course.coverImage?.asset?._id}
        alt={course.coverImage?.alt}
        lqip={course.coverImage?.asset?.metadata?.lqip}
        title={course.title}
        size={392}
        priority
        className="aspect-square w-full max-w-[392px] lg:w-[392px]"
      />

      <div className="min-w-0 flex-1">
        {course.popular && <Badge variant="popular">Popular</Badge>}

        <h1
          className={`font-display text-[clamp(2.25rem,4.5vw,3.9rem)] leading-[1.12] font-bold text-neutral-900 ${course.popular ? "mt-5" : ""}`}
        >
          {course.title}
        </h1>

        <p className="mt-5 max-w-[52ch] text-body-lg text-neutral-700">
          {course.summary}
        </p>

        <ul className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3">
          {level && (
            <Meta
              icon={<ChartNoAxesColumn className="h-4 w-4" strokeWidth={2} />}
            >
              {level}
            </Meta>
          )}
          <Meta icon={<Clock className="h-4 w-4" strokeWidth={2} />}>
            {totalDuration}
          </Meta>
          <Meta icon={<Folder className="h-4 w-4" strokeWidth={2} />}>
            {moduleCount} {moduleCount === 1 ? "module" : "modules"}
          </Meta>
          {course.studentCount != null && (
            <Meta icon={<Users className="h-4 w-4" strokeWidth={2} />}>
              {formatCompactCount(course.studentCount)} students
            </Meta>
          )}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          {continueHref && (
            <ButtonLink
              href={continueHref}
              size="xl"
              icon={<ArrowRight className="h-5 w-5" strokeWidth={2} />}
            >
              Start Learning
            </ButtonLink>
          )}
          {/* Presentational only, like the notifications bell (AGENTS.md §7). */}
          <Button
            variant="tertiary"
            size="xl"
            aria-disabled="true"
            iconPosition="leading"
            icon={<Bookmark className="h-5 w-5" strokeWidth={1.75} />}
          >
            Bookmark
          </Button>
        </div>
      </div>
    </section>
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
