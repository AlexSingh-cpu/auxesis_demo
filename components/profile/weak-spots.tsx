import Link from "next/link";
import type { WeakSpot } from "@/lib/types";
import { cn, formatPercent } from "@/lib/utils";

/** Ember is reserved for genuinely poor recall, so the weakest topics stand out
 *  from the merely middling ones rather than all reading as alarming. */
function barTone(accuracy: number) {
  if (accuracy < 50) return "bg-ember";
  if (accuracy < 70) return "bg-flag";
  return "bg-accent";
}

export function WeakSpots({ spots }: { spots: WeakSpot[] }) {
  return (
    <ul className="flex flex-col">
      {spots.map((spot) => (
        <li
          key={spot.topicId}
          className="flex flex-col gap-2 border-b border-line px-5 py-3.5 last:border-0"
        >
          <div className="flex items-baseline justify-between gap-3">
            {/* Straight into a filtered session on that topic. */}
            <Link
              href={`/dashboard?topic=${spot.topicId}`}
              className="truncate text-sm text-ink transition-colors duration-150 hover:text-accent"
            >
              {spot.label}
            </Link>
            <span className="shrink-0 font-mono tnum text-[13px] text-ink">
              {formatPercent(spot.accuracy)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
              <div
                className={cn("h-full rounded-full", barTone(spot.accuracy))}
                style={{ width: `${spot.accuracy}%` }}
              />
            </div>
            <span
              className="shrink-0 font-mono tnum text-[12px] text-ink-3"
              title={`${spot.attempted} attempts`}
            >
              {spot.attempted}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
