import Link from "next/link";
import { ReactNode } from "react";
import { Logo } from "./Logo";

const links = [
  { href: "/courses", label: "Courses" },
  { href: "/my-learning", label: "My Learning" },
];

/* Design system §13. Presentational only — auth wiring comes later. */
export function Nav({
  activeHref,
  actions,
}: { activeHref?: string; actions?: ReactNode } = {}) {
  return (
    <header className="flex flex-wrap items-center gap-x-14 gap-y-4 border-b border-neutral-200 bg-white px-6 py-4 md:px-8">
      <Logo />
      <nav className="order-last flex w-full items-center gap-8 text-body-lg font-medium md:order-none md:w-auto">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              link.href === activeHref
                ? "text-primary-500"
                : "text-neutral-700 hover:text-neutral-900"
            }
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {actions && (
        <div className="ml-auto flex items-center gap-4">{actions}</div>
      )}
    </header>
  );
}
