import { ArrowRight, Search } from "lucide-react";

import { ButtonLink } from "../ui/Button";

/**
 * The "Can't find what you're looking for?" panel (design/vertex-search.png).
 *
 * It closes a result list and stands in for one when a query matches nothing —
 * an empty search points at the full catalog rather than at a dead end (§11).
 */
export function SearchEmptyState() {
  return (
    <section className="flex flex-col items-start gap-4 rounded-md border border-primary-200 bg-primary-100 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-200"
        >
          <Search className="h-5 w-5 text-primary-500" strokeWidth={2} />
        </span>
        <div>
          <p className="text-heading-3 font-semibold text-neutral-900">
            Can&rsquo;t find what you&rsquo;re looking for?
          </p>
          <p className="mt-1 text-body text-neutral-700">
            Try different keywords or browse our full course catalog.
          </p>
        </div>
      </div>
      <ButtonLink
        href="/courses"
        variant="secondary"
        icon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
      >
        Browse all courses
      </ButtonLink>
    </section>
  );
}
