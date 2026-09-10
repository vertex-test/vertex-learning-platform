import { ExternalLink } from "lucide-react";
import { Badge } from "../Badge";
import { PlayCircleFilled } from "../PlayCircleFilled";
import { Card } from "./Card";

interface LessonCardVideoProps {
  variant: "video";
  title: string;
  description: string;
  lessonLabel: string;
  /** Display timestamp, e.g. "12:45". */
  timestamp: string;
}

interface LessonCardLessonProps {
  variant: "lesson";
  title: string;
  description: string;
  moduleLabel: string;
}

type LessonCardProps = LessonCardVideoProps | LessonCardLessonProps;

/* Design system §12: video results carry a timestamped watch action, lesson
   results open the lesson page. */
export function LessonCard(props: LessonCardProps) {
  return (
    <Card>
      <div>
        <Badge variant={props.variant}>{props.variant}</Badge>
        <h3 className="mt-4 text-heading-3 font-semibold text-neutral-900">
          {props.title}
        </h3>
        <p className="mt-2 text-body text-neutral-500">{props.description}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {props.variant === "video" ? (
          <>
            <span className="text-small text-neutral-500">
              {props.lessonLabel} &nbsp;·&nbsp; {props.timestamp}
            </span>
            <span className="inline-flex items-center gap-2 text-small font-semibold whitespace-nowrap text-primary-500">
              <PlayCircleFilled className="h-4 w-4" />
              Watch from {props.timestamp}
            </span>
          </>
        ) : (
          <>
            <span className="text-small text-neutral-500">
              {props.moduleLabel}
            </span>
            <span className="inline-flex items-center gap-2 text-small font-semibold whitespace-nowrap text-primary-500">
              View lesson
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
          </>
        )}
      </div>
    </Card>
  );
}
