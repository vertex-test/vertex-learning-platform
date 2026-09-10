import Link from "next/link";
import { Logo } from "./Logo";

const links = [
  { href: "/courses", label: "Courses" },
  { href: "/my-learning", label: "My Learning" },
];

/* Design system §13. Presentational only — auth wiring comes later. */
export function Nav({ activeHref }: { activeHref?: string } = {}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 bg-white px-6 py-4 md:px-8">
      <Logo />
      <nav className="flex items-center gap-6 text-body-lg font-medium">
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
    </header>
  );
}
