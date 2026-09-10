import { Search } from "lucide-react";

/**
 * The hero search field (design/vertex-home.png) — taller than the §08
 * primitive and with a bordered key-cap instead of plain shortcut text.
 * Presentational for now; it gets wired to the search route with the
 * search work.
 */
export function HeroSearch({
  placeholder = "Ask anything about your learning...",
}: {
  placeholder?: string;
}) {
  return (
    <div className="relative flex w-full items-center">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-5 h-5 w-5 text-neutral-500 sm:left-6"
        strokeWidth={2}
      />
      <input
        type="search"
        aria-label="Search your learning"
        placeholder={placeholder}
        className="h-[72px] w-full rounded-md border border-neutral-200 bg-white pr-5 pl-12 sm:h-[88px] sm:pr-24 sm:pl-14 text-body text-neutral-900 shadow-sm sm:text-body-lg outline-none placeholder:text-neutral-500 focus:border-primary-400"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-5 hidden rounded-xs border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-body text-neutral-500 sm:block"
      >
        ⌘ K
      </span>
    </div>
  );
}
