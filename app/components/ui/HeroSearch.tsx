"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * The hero search field (design/vertex-home.png) — taller than the §08
 * primitive and with a bordered key-cap instead of plain shortcut text.
 *
 * It submits to /search, which is where the agent runs. The field itself never
 * calls the search API: the results page owns that request (AGENTS.md §5).
 */
export function HeroSearch({
  placeholder = "Ask anything about your learning...",
  defaultValue = "",
  autoFocus = false,
  /** `compact` is the shorter field above the results list (vertex-search.png). */
  variant = "hero",
}: {
  placeholder?: string;
  defaultValue?: string;
  autoFocus?: boolean;
  variant?: "hero" | "compact";
}) {
  const compact = variant === "compact";
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [syncedWith, setSyncedWith] = useState(defaultValue);

  // Keeps the field in step when the results page navigates between queries.
  // Adjusted during render rather than in an effect: React re-renders before
  // painting, so the field never flashes the previous query.
  if (syncedWith !== defaultValue) {
    setSyncedWith(defaultValue);
    setValue(defaultValue);
  }

  // ⌘K / Ctrl+K focuses the field, which is what the key-cap promises.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "k" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <form
      role="search"
      className="relative flex w-full items-center"
      onSubmit={(event) => {
        event.preventDefault();
        const query = value.trim();
        if (!query) return;
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }}
    >
      <Search
        aria-hidden="true"
        className={`pointer-events-none absolute h-5 w-5 text-neutral-500 ${compact ? "left-5" : "left-5 sm:left-6"}`}
        strokeWidth={2}
      />
      <input
        ref={inputRef}
        type="search"
        name="q"
        aria-label="Search your learning"
        placeholder={placeholder}
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => setValue(event.target.value)}
        className={`w-full rounded-md border border-neutral-200 bg-white pl-12 text-neutral-900 shadow-sm outline-none placeholder:text-neutral-500 focus:border-primary-400 ${
          compact
            ? "h-14 pr-5 text-body-lg sm:pr-20"
            : "h-[72px] pr-5 text-body sm:h-[88px] sm:pr-24 sm:pl-14 sm:text-body-lg"
        }`}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-5 hidden rounded-xs border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-body text-neutral-500 sm:block"
      >
        ⌘ K
      </span>
    </form>
  );
}
