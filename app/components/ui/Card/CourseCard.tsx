import Link from "next/link";
import { ChartNoAxesColumn, Clock, Folder } from "lucide-react";
import { ReactNode } from "react";
import { Card } from "./Card";

export interface CourseCardProps {
  /** Letter tile fallback, used when `icon` is not supplied. */
  initial?: string;
  /** Brand mark rendered in place of the letter tile. */
  icon?: ReactNode;
  title: string;
  summary: string;
  level: string;
  duration: string;
  moduleCount: number;
  /** `inline` is design system §12; `stacked` is the home page grid. */
  layout?: "inline" | "stacked";
  href?: string;
}

function Meta({
  icon,
  children,
  dense,
}: {
  icon: ReactNode;
  children: ReactNode;
  /* The stacked card's meta row sits below the 12px token so all three
     items stay on one line inside a 3-up grid, as in the reference. */
  dense?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap text-neutral-500 ${dense ? "text-[10px] leading-4 xl:text-[11px] [&_svg]:h-3 [&_svg]:w-3" : "text-small"}`}
    >
      {icon}
      {children}
    </span>
  );
}

export function CourseCard({
  initial,
  icon,
  title,
  summary,
  level,
  duration,
  moduleCount,
  layout = "inline",
  href,
}: CourseCardProps) {
  const stacked = layout === "stacked";

  const tile = icon ?? (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-neutral-900 text-heading-3 font-semibold text-white">
      {initial}
    </span>
  );

  const body = (
    <Card
      className={
        stacked
          ? "h-full gap-0 p-6 transition-shadow hover:shadow-md"
          : undefined
      }
    >
      <div className={stacked ? "" : "flex items-start gap-4"}>
        {tile}
        <div className={stacked ? "" : "min-w-0"}>
          <h3
            className={
              stacked
                ? "mt-6 font-display text-heading-3 font-bold text-neutral-900"
                : "text-heading-3 font-semibold text-neutral-900"
            }
          >
            {title}
          </h3>
          <p
            className={`text-body text-neutral-500 ${stacked ? "mt-3" : "mt-1.5"}`}
          >
            {summary}
          </p>
        </div>
      </div>
      <div
        className={
          stacked
            ? "mt-auto flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-neutral-200 pt-4"
            : "flex flex-wrap items-center gap-x-6 gap-y-2"
        }
      >
        <Meta dense={stacked} icon={<ChartNoAxesColumn className="h-3.5 w-3.5" strokeWidth={2} />}>
          {level}
        </Meta>
        <Meta dense={stacked} icon={<Clock className="h-3.5 w-3.5" strokeWidth={2} />}>
          {duration}
        </Meta>
        <Meta dense={stacked} icon={<Folder className="h-3.5 w-3.5" strokeWidth={2} />}>
          {moduleCount} modules
        </Meta>
      </div>
    </Card>
  );

  if (!href) return body;

  return (
    <Link
      href={href}
      className="flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
    >
      {body}
    </Link>
  );
}
