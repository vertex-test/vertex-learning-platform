import type { Metadata } from "next";

import { COURSES_CATALOG_QUERY } from "@/sanity/lib/queries";
import { sanityFetch } from "@/sanity/lib/fetch";
import type { COURSES_CATALOG_QUERY_RESULT } from "@/sanity.types";

import { SiteHeader } from "@/app/components/SiteHeader";
import { CatalogGrid } from "@/app/components/course/CatalogGrid";
import { ViewTracker } from "@/app/components/ui/ViewTracker";

export const metadata: Metadata = {
  title: "All Courses — Vertex",
  description: "Every course on Vertex.",
};

export default async function CoursesPage() {
  // Already ordered popular-first, then title (sanity/lib/queries.ts).
  const courses: COURSES_CATALOG_QUERY_RESULT = await sanityFetch({
    query: COURSES_CATALOG_QUERY,
    tags: ["course"],
  });

  return (
    <div className="page-hatch flex flex-1 flex-col bg-canvas sm:px-8">
      <div className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col bg-canvas sm:border-x sm:border-neutral-200">
        <SiteHeader activeHref="/courses" />

        {/* The top of the browse funnel (AGENTS.md §7). */}
        <ViewTracker
          eventName="catalog_viewed"
          properties={{ course_count: courses.length }}
        />

        <main className="flex-1 px-6 pt-10 pb-16 md:px-12 md:pt-14">
          <h1 className="font-display text-display-2 font-bold text-neutral-900">
            All Courses
          </h1>
          <p className="mt-3 text-body-lg text-neutral-700">
            {courses.length} {courses.length === 1 ? "course" : "courses"} to
            learn from.
          </p>

          <div className="mt-8">
            <CatalogGrid courses={courses} />
          </div>
        </main>
      </div>
    </div>
  );
}
