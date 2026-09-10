import { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";

/* Design system §08 field specs: 44px height, 12px radius,
   1px #E2E8F0 border, 0 16px padding, focus border #FB923C. */
const fieldClasses =
  "h-11 w-full rounded-md border border-neutral-200 bg-white text-body text-neutral-900 outline-none placeholder:text-neutral-500 focus:border-primary-400";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Keyboard hint rendered on the right, e.g. "⌘K". */
  shortcut?: string;
}

export function SearchInput({ shortcut, className = "", ...props }: InputProps) {
  return (
    <div className="relative flex items-center">
      <Search
        className="pointer-events-none absolute left-4 h-4 w-4 text-neutral-500"
        strokeWidth={2}
      />
      <input
        type="search"
        className={`${fieldClasses} pr-14 pl-10 ${className}`}
        {...props}
      />
      {shortcut && (
        <span className="pointer-events-none absolute right-4 text-body text-neutral-500">
          {shortcut}
        </span>
      )}
    </div>
  );
}

export function Input({ className = "", ...props }: InputProps) {
  return <input type="text" className={`${fieldClasses} px-4 ${className}`} {...props} />;
}
