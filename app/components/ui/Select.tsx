import { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/* Design system §08 — same field specs as Input. */
export function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={`h-11 w-full appearance-none rounded-md border border-neutral-200 bg-white pr-10 pl-4 text-body font-medium text-neutral-900 outline-none focus:border-primary-400 ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-neutral-500"
        strokeWidth={2}
      />
    </div>
  );
}
