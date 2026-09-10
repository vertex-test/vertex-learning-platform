"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

function pageItems(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 1) return [1];
  const items: (number | "ellipsis")[] = [1];
  if (current > 3) items.push("ellipsis");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    items.push(p);
  }
  if (current < total - 2) items.push("ellipsis");
  items.push(total);
  return items;
}

const cell =
  "flex h-9 w-9 items-center justify-center rounded-xs text-body text-neutral-500";

/* Design system §13. */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  return (
    <nav aria-label="Pagination" className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Previous page"
        disabled={currentPage === 1}
        onClick={() => onPageChange?.(currentPage - 1)}
        className={`${cell} hover:text-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-300`}
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2} />
      </button>
      {pageItems(currentPage, totalPages).map((item, i) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className={cell}>
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === currentPage ? "page" : undefined}
            onClick={() => onPageChange?.(item)}
            className={`${cell} ${
              item === currentPage
                ? "border border-primary-400 text-primary-500"
                : "hover:text-neutral-900"
            }`}
          >
            {item}
          </button>
        )
      )}
      <button
        type="button"
        aria-label="Next page"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange?.(currentPage + 1)}
        className={`${cell} hover:text-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-300`}
      >
        <ChevronRight className="h-4 w-4" strokeWidth={2} />
      </button>
    </nav>
  );
}
