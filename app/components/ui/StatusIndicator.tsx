import { CircleCheck, LoaderCircle, Lock } from "lucide-react";
import { ReactNode } from "react";
import { PlayCircleFilled } from "./PlayCircleFilled";

type Status = "in-progress" | "completed" | "now-playing" | "locked";

/* Design system §10. */
const statusConfig: Record<
  Status,
  { icon: ReactNode; label: string; className: string }
> = {
  "in-progress": {
    icon: <LoaderCircle className="h-4 w-4" strokeWidth={2} />,
    label: "In Progress",
    className: "text-primary-500",
  },
  completed: {
    icon: <CircleCheck className="h-4 w-4" strokeWidth={2} />,
    label: "Completed",
    className: "text-success",
  },
  "now-playing": {
    icon: <PlayCircleFilled />,
    label: "Now Playing",
    className: "text-primary-500",
  },
  locked: {
    icon: <Lock className="h-4 w-4" strokeWidth={2} />,
    label: "Locked",
    className: "text-neutral-900",
  },
};

export function StatusIndicator({ status }: { status: Status }) {
  const { icon, label, className } = statusConfig[status];
  return (
    <span className="inline-flex items-center gap-2 text-body whitespace-nowrap text-neutral-900">
      <span className={className}>{icon}</span>
      {label}
    </span>
  );
}
