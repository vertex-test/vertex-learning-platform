import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

import { COURSES_CATALOG_QUERY } from "@/sanity/lib/queries";
import { sanityFetch } from "@/sanity/lib/fetch";
import type { COURSES_CATALOG_QUERY_RESULT } from "@/sanity.types";

import { SiteHeader } from "./components/SiteHeader";
import { CatalogGrid } from "./components/course/CatalogGrid";
import { ButtonLink } from "./components/ui/Button";
import { HeroSearch } from "./components/ui/HeroSearch";

/** The home page previews the catalog; the full list lives at /courses. */
const PREVIEW_COUNT = 3;

export default async function Home() {
  // Already ordered popular-first, then title (sanity/lib/queries.ts).
  const catalog: COURSES_CATALOG_QUERY_RESULT = await sanityFetch({
    query: COURSES_CATALOG_QUERY,
    tags: ["course"],
  });
  const courses = catalog.slice(0, PREVIEW_COUNT);

  return (
    <div className="page-hatch flex flex-1 flex-col bg-canvas sm:px-8">
      <div className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col bg-canvas sm:border-x sm:border-neutral-200">
        <SiteHeader />

        {/* Hero */}
        <section className="flex flex-col items-center px-6 pt-14 pb-14 text-center md:px-12 md:pt-[70px] md:pb-[52px]">
          <span className="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-small font-bold tracking-[0.14em] text-primary-500 uppercase">
            Intelligent Learning
          </span>

          <h1 className="mt-10 max-w-[15ch] font-display text-[clamp(2.5rem,5.5vw,5rem)] leading-[1.15] font-bold text-balance text-neutral-900">
            Search your learning in plain English.
          </h1>

          <p className="mt-8 max-w-[44ch] text-body-lg text-neutral-700 text-balance">
            Vertex understands what you want to learn and finds the exact
            lessons across all your courses.
          </p>

          <ButtonLink
            href="/courses"
            size="xl"
            className="mt-10"
            icon={<ArrowRight className="h-5 w-5" strokeWidth={2} />}
          >
            Explore Courses
          </ButtonLink>

          <div className="mt-10 w-full max-w-[746px]">
            <HeroSearch />
          </div>
        </section>

        {/* All Courses */}
        <section className="border-t border-neutral-200 px-6 pt-11 pb-16 md:px-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-display-2 font-bold text-neutral-900">
              All Courses
            </h2>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-sm text-body font-medium text-primary-500 outline-none hover:text-primary-600 focus-visible:ring-2 focus-visible:ring-primary-400"
            >
              View all courses
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>

          <div className="mt-6">
            <CatalogGrid courses={courses} />
          </div>
        </section>

        {/* Footer band */}
        <section className="px-6 md:px-12">
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="hidden h-px flex-1 bg-neutral-200 sm:block" />
            <span className="inline-flex items-center gap-4 text-body-lg text-neutral-700 sm:whitespace-nowrap">
              <Star
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-primary-500"
                strokeWidth={1.75}
              />
              New courses and lessons added every week.
            </span>
            <span className="hidden h-px flex-1 bg-neutral-200 sm:block" />
          </div>
          <BarBand />
        </section>
      </div>
    </div>
  );
}

/** Decorative bar band that bleeds off the bottom of the page. */
const barHeights = [
  38, 62, 46, 78, 58, 88, 44, 0, 52, 80, 42, 70, 60, 92, 50, 74,
];

function BarBand() {
  return (
    <div
      aria-hidden="true"
      className="mt-10 flex h-28 items-end gap-1.5 overflow-hidden sm:h-40 sm:gap-3"
    >
      {barHeights.map((height, index) => (
        <span
          key={index}
          style={{ height: `${height}%` }}
          className="flex-1 rounded-t-xs bg-gradient-to-b from-primary-400/70 to-transparent"
        />
      ))}
    </div>
  );
}
