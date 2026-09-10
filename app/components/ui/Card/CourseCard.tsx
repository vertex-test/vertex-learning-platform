import { ChartNoAxesColumn, Clock, Folder } from "lucide-react";
import { ReactNode } from "react";
import { Card } from "./Card";

export interface CourseCardProps {
  initial: string;
  title: string;
  summary: string;
  level: string;
  duration: string;
  moduleCount: number;
}

function Meta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-small whitespace-nowrap text-neutral-500">
      {icon}
      {children}
    </span>
  );
}

export function CourseCard({
  initial,
  title,
  summary,
  level,
  duration,
  moduleCount,
}: CourseCardProps) {
  return (
    <Card>
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-neutral-900 text-heading-3 font-semibold text-white">
          {initial}
        </span>
        <div className="min-w-0">
          <h3 className="text-heading-3 font-semibold text-neutral-900">
            {title}
          </h3>
          <p className="mt-1.5 text-body text-neutral-500">{summary}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Meta icon={<ChartNoAxesColumn className="h-4 w-4" strokeWidth={2} />}>
          {level}
        </Meta>
        <Meta icon={<Clock className="h-4 w-4" strokeWidth={2} />}>
          {duration}
        </Meta>
        <Meta icon={<Folder className="h-4 w-4" strokeWidth={2} />}>
          {moduleCount} modules
        </Meta>
      </div>
    </Card>
  );
}
