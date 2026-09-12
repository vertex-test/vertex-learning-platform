import type { Metadata } from "next";

import { SiteHeader } from "@/app/components/SiteHeader";
import { SearchResults } from "@/app/components/search/SearchResults";

export const metadata: Metadata = {
  title: "Search — Vertex",
  description: "Find the lesson that teaches what you are looking for.",
};

/** A query longer than the route accepts is trimmed here rather than rejected. */
const MAX_QUERY_LENGTH = 200;

/**
 * The search results page (AGENTS.md §11): a full page of ranked results, not a
 * widget and not a chatbox.
 *
 * The shell is a server component; the results themselves stream in through the
 * client component, which is the only side that talks to /api/search.
 */
export default async function SearchPage(props: PageProps<"/search">) {
  const { q } = await props.searchParams;
  const raw = Array.isArray(q) ? q[0] : q;
  const query = (raw ?? "").trim().slice(0, MAX_QUERY_LENGTH);

  return (
    <div className="page-hatch flex flex-1 flex-col bg-canvas sm:px-8">
      <div className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col bg-canvas sm:border-x sm:border-neutral-200">
        <SiteHeader />

        <main className="flex-1 px-6 pt-10 pb-16 md:px-12 md:pt-14">
          <SearchResults query={query} />
        </main>
      </div>
    </div>
  );
}
