import { ReactNode } from "react";

type BadgeVariant = "video" | "lesson" | "popular";

/* Design system §09. */
const variantClasses: Record<BadgeVariant, string> = {
  video: "bg-primary-100 text-primary-500",
  lesson: "bg-accent-lesson-bg text-accent-lesson",
  popular: "bg-primary-100 text-primary-500",
};

export function Badge({
  variant,
  children,
}: {
  variant: BadgeVariant;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-xs px-2 py-1 text-small font-bold tracking-wider uppercase ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
