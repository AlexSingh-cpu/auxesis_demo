import type { Attempt, AttemptOutcome } from "@/lib/types";
import { cn, formatDuration } from "@/lib/utils";

const TONE: Record<AttemptOutcome, { bar: string; label: string }> = {
  correct: { bar: "bg-accent", label: "Correct" },
  incorrect: { bar: "bg-ember", label: "Missed" },
  partial: { bar: "bg-flag", label: "Partial" },
  skipped: { bar: "bg-line-strong", label: "Skipped" },
};

/**
 * Every recent attempt as one tick, oldest to newest. Reading a run of ember
 * at the right edge tells you more about today than any single number does.
 */
export function AttemptRibbon({
  attempts,
  compact,
}: {
  attempts: Attempt[];
  compact?: boolean;
}) {
  const scored = attempts.filter((a) => a.outcome !== "skipped");
  const correct = scored.filter((a) => a.outcome === "correct").length;

  return (
    <div className={cn("flex flex-col", compact ? "gap-2.5" : "gap-4")}>
      <div className="flex items-end gap-[3px]" role="img"
        aria-label={`Last ${attempts.length} attempts, ${correct} correct`}
      >
        {attempts.map((attempt) => {
          const tone = TONE[attempt.outcome];
          const date = new Date(attempt.at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          return (
            <span
              key={attempt.id}
              title={`${tone.label} · ${date} · ${formatDuration(attempt.seconds)}`}
              className={cn(
                "flex-1 rounded-micro transition-transform duration-150",
                "ease-[var(--ease-out-quint)] hover:scale-y-110",
                compact ? "h-6" : "h-8",
                tone.bar,
                // A skip is an absence, not a result, so it sits lower.
                attempt.outcome === "skipped" &&
                  (compact ? "h-3 self-end" : "h-4 self-end")
              )}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <p className="text-[13px] text-ink-2">
          <span className="font-mono tnum text-ink">{correct}</span> of{" "}
          <span className="font-mono tnum text-ink">{scored.length}</span> correct
        </p>
        <div
          className={cn(
            "flex-wrap items-center gap-x-4 gap-y-1.5",
            compact ? "hidden xl:flex" : "flex"
          )}
        >
          {(Object.keys(TONE) as AttemptOutcome[]).map((outcome) => (
            <span
              key={outcome}
              className="flex items-center gap-1.5 text-[12px] text-ink-3"
            >
              <span
                aria-hidden
                className={cn("h-2.5 w-1 rounded-micro", TONE[outcome].bar)}
              />
              {TONE[outcome].label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
