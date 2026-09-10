import { ReactNode } from "react";

/** Shared card shell: white, 1px neutral-200 border, 12px radius (§12). */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex w-full flex-col gap-4 rounded-md border border-neutral-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
