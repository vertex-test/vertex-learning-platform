import {
  Cloud,
  Code,
  Database,
  Gauge,
  GitBranch,
  Layers,
  type LucideIcon,
  Puzzle,
  Rocket,
  Shield,
  Sparkles,
  Terminal,
  Workflow,
  Zap,
} from "lucide-react";

/**
 * The frontend half of the `learningOutcome.icon` contract (AGENTS.md §8): the
 * Studio curates a fixed list of names so authors cannot break the design, and
 * this maps each one to its mark. Anything unknown falls back to Sparkles.
 */
const icons: Record<string, LucideIcon> = {
  cloud: Cloud,
  code: Code,
  database: Database,
  gauge: Gauge,
  "git-branch": GitBranch,
  layers: Layers,
  puzzle: Puzzle,
  rocket: Rocket,
  shield: Shield,
  sparkles: Sparkles,
  terminal: Terminal,
  workflow: Workflow,
  zap: Zap,
};

export function OutcomeIcon({
  name,
  className = "",
}: {
  name: string | null | undefined;
  className?: string;
}) {
  const Icon = (name && icons[name]) || Sparkles;
  return (
    <Icon
      aria-hidden="true"
      className={`shrink-0 text-primary-500 ${className}`}
      strokeWidth={1.5}
    />
  );
}
