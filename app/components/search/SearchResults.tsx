"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { captureEvent } from "@/app/lib/posthog-client";
import {
  isSortOption,
  SORT_OPTIONS,
  type SearchResult,
  type SearchStreamEvent,
  type SortOption,
} from "@/app/lib/search/schema";

import { HeroSearch } from "../ui/HeroSearch";
import { Select } from "../ui/Select";
import { LessonResultCard } from "./LessonResultCard";
import { SearchEmptyState } from "./SearchEmptyState";

/**
 * The search results page (design/vertex-search.png).
 *
 * A client component by necessity: it reads the NDJSON the search route streams
 * (AGENTS.md §5). It holds no token, never calls the MCP or the LLM, and only
 * renders what the route hydrated from Sanity.
 */

type SearchState = {
  status: "idle" | "loading" | "done" | "error";
  message: string | null;
  results: SearchResult[];
  resultCount: number;
  courseCount: number;
};

const IDLE: SearchState = {
  status: "idle",
  message: null,
  results: [],
  resultCount: 0,
  courseCount: 0,
};

function sortResults(
  results: SearchResult[],
  sort: SortOption,
): SearchResult[] {
  // "relevance" is the agent's own ranking, which is the order it arrived in.
  if (sort === "relevance") return results;

  const direction = sort === "shortest" ? 1 : -1;
  return [...results].sort(
    (a, b) =>
      direction * ((a.durationSeconds ?? 0) - (b.durationSeconds ?? 0)),
  );
}

function ResultSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex w-full animate-pulse flex-col gap-5 rounded-md border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row"
    >
      <div className="h-[132px] w-full shrink-0 rounded-sm bg-neutral-100 sm:w-[276px]" />
      <div className="flex flex-1 flex-col gap-3 py-1">
        <div className="h-4 w-40 rounded-xs bg-neutral-100" />
        <div className="h-6 w-3/5 rounded-xs bg-neutral-100" />
        <div className="h-4 w-full rounded-xs bg-neutral-100" />
        <div className="h-4 w-2/3 rounded-xs bg-neutral-100" />
      </div>
    </div>
  );
}

/** A fresh query starts in `loading`; an empty one has nothing to load. */
function initialState(query: string): SearchState {
  return query ? { ...IDLE, status: "loading" } : IDLE;
}

export function SearchResults({ query }: { query: string }) {
  const [state, setState] = useState<SearchState>(() => initialState(query));
  const [sort, setSort] = useState<SortOption>("relevance");
  const [searchedFor, setSearchedFor] = useState(query);
  /** Guards the analytics event against React's development double-effect. */
  const captured = useRef<string | null>(null);

  // Reset during render rather than in the effect below: the skeletons must be
  // what the new query's first paint shows, not the previous query's results.
  if (searchedFor !== query) {
    setSearchedFor(query);
    setState(initialState(query));
    setSort("relevance");
  }

  useEffect(() => {
    if (!query) return;

    const controller = new AbortController();

    async function run() {
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const fallback = await response
            .json()
            .catch(() => ({ message: "Search is unavailable right now." }));
          setState({
            ...IDLE,
            status: "error",
            message: fallback.message ?? "Search is unavailable right now.",
          });
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // One JSON event per line; the last line may arrive split across chunks.
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;

            let event: SearchStreamEvent;
            try {
              event = JSON.parse(line);
            } catch {
              continue;
            }

            if (event.type === "status") {
              setState((current) => ({ ...current, message: event.message }));
            } else if (event.type === "error") {
              setState({ ...IDLE, status: "error", message: event.message });
            } else if (event.type === "results") {
              setState({
                status: "done",
                message: event.reply,
                results: event.results,
                resultCount: event.resultCount,
                courseCount: event.courseCount,
              });

              const key = `${query}:${event.resultCount}`;
              if (captured.current !== key) {
                captured.current = key;
                captureEvent("search_performed", {
                  query,
                  resultCount: event.resultCount,
                  courseCount: event.courseCount,
                });
              }
            }
          }
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(error);
        setState({
          ...IDLE,
          status: "error",
          message: "Search is unavailable right now.",
        });
      }
    }

    run();
    return () => controller.abort();
  }, [query]);

  const sorted = useMemo(
    () => sortResults(state.results, sort),
    [state.results, sort],
  );

  const isLoading = state.status === "loading";
  const hasResults = state.results.length > 0;

  return (
    <>
      {/* Heading */}
      <div className="flex flex-col items-center text-center">
        <span className="rounded-xs bg-primary-100 px-3 py-1.5 text-small font-bold tracking-wider text-primary-500 uppercase">
          Search results
        </span>
        <h1 className="mt-6 font-display text-display-2 font-bold text-neutral-900 sm:text-display-1">
          {query ? (
            <>
              Results for{" "}
              <span className="text-primary-500">&ldquo;{query}&rdquo;</span>
            </>
          ) : (
            "Search Vertex"
          )}
        </h1>
        <p className="mt-3 text-body-lg text-neutral-500" aria-live="polite">
          {!query
            ? "Ask anything about your learning."
            : isLoading
              ? "Searching…"
              : state.status === "error"
                ? state.message
                : `Found ${state.resultCount} ${
                    state.resultCount === 1 ? "result" : "results"
                  } across ${state.courseCount} ${
                    state.courseCount === 1 ? "course" : "courses"
                  }`}
        </p>

        <div className="mt-6 w-full max-w-[730px]">
          <HeroSearch
            variant="compact"
            defaultValue={query}
            autoFocus={!query}
          />
        </div>
      </div>

      {/* Count and sort */}
      {(isLoading || hasResults) && (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-heading-3 font-semibold text-neutral-900">
            {isLoading
              ? "Searching…"
              : `${state.resultCount} ${state.resultCount === 1 ? "result" : "results"}`}
          </p>
          <Select
            aria-label="Sort results"
            className="w-[180px]"
            value={sort}
            disabled={isLoading}
            onChange={(event) => {
              if (isSortOption(event.target.value)) setSort(event.target.value);
            }}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Results */}
      <div className="mt-4 flex flex-col gap-3">
        {isLoading &&
          [0, 1, 2].map((index) => <ResultSkeleton key={index} />)}

        {!isLoading &&
          sorted.map((result, index) => (
            <LessonResultCard
              key={result.lessonId}
              result={result}
              query={query}
              rank={index + 1}
            />
          ))}
      </div>

      {!isLoading && (
        <div className="mt-3">
          <SearchEmptyState />
        </div>
      )}
    </>
  );
}
