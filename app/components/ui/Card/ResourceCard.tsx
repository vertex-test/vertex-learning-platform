import { ExternalLink, FileText } from "lucide-react";
import { Card } from "./Card";

export interface ResourceCardProps {
  title: string;
  description: string;
  /** e.g. "PDF · 1.2 MB" */
  meta: string;
}

export function ResourceCard({ title, description, meta }: ResourceCardProps) {
  return (
    <Card>
      <div className="flex items-start gap-4">
        <FileText
          className="h-6 w-6 shrink-0 text-neutral-900"
          strokeWidth={2}
        />
        <div className="min-w-0">
          <h3 className="text-heading-3 font-semibold text-neutral-900">
            {title}
          </h3>
          <p className="mt-2 text-body text-neutral-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-small text-neutral-500">{meta}</span>
        <ExternalLink className="h-4 w-4 text-primary-500" strokeWidth={2} />
      </div>
    </Card>
  );
}
