/* Design system §11. */
export function ProgressBar({
  percent,
  showLabel = true,
}: {
  percent: number;
  showLabel?: boolean;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <div className="flex items-center gap-4">
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 flex-1 rounded-full bg-neutral-100"
      >
        <div
          className="h-1.5 rounded-full bg-primary-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-body whitespace-nowrap text-neutral-500">
          <span className="font-semibold text-neutral-900">{clamped}%</span>{" "}
          complete
        </span>
      )}
    </div>
  );
}
