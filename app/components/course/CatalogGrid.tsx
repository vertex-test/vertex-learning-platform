import { formatDuration, formatLevel } from "@/sanity/lib/derive";
import type { COURSES_CATALOG_QUERY_RESULT } from "@/sanity.types";

import { CourseCard } from "../ui/Card/CourseCard";
import { CourseCover } from "../ui/CourseCover";

/**
 * The catalog card grid, shared by the home page's three-card preview and the
 * full /courses listing so the two can never drift apart.
 *
 * Presentational: it takes query rows and nothing else.
 */
export function CatalogGrid({
  courses,
}: {
  courses: COURSES_CATALOG_QUERY_RESULT;
}) {
  if (courses.length === 0) {
    return <p className="text-body-lg text-neutral-500">No courses yet.</p>;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard
          key={course._id}
          layout="stacked"
          href={course.slug ? `/courses/${course.slug}` : undefined}
          icon={
            <CourseCover
              assetId={course.coverImage?.asset?._id}
              alt={course.coverImage?.alt}
              lqip={course.coverImage?.asset?.metadata?.lqip}
              title={course.title}
              size={72}
              className="h-[72px] w-[72px] rounded-md"
            />
          }
          title={course.title ?? ""}
          summary={course.summary ?? ""}
          level={formatLevel(course.level)}
          duration={formatDuration(course.totalDurationSeconds)}
          moduleCount={course.moduleCount ?? 0}
        />
      ))}
    </div>
  );
}
