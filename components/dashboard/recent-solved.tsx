import Link from "next/link";
import { AttemptRibbon } from "@/components/dashboard/attempt-ribbon";
import { OutcomeBadge } from "@/components/ui/stat";
import type { Attempt, SolvedItem } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

/** Relative time reads better than a date for things that happened today. */
function sinceLabel(iso: string, now: Date) {
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function RecentSolved({
  attempts,
  solved,
  now,
}: {
  attempts: Attempt[];
  solved: SolvedItem[];
  /** Passed in rather than read here, so the server and client agree. */
  now: string;
}) {
  const reference = new Date(now);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-line px-5 py-3.5">
        <AttemptRibbon attempts={attempts} compact />
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {solved.map((item) => (
          <li key={item.attemptId} className="border-b border-line last:border-0">
            <Link
              href={`/solve/${item.problemId}`}
              className="flex items-center gap-3 px-5 py-2.5 transition-colors duration-150 hover:bg-surface-2"
            >
              <OutcomeBadge outcome={item.outcome} />
              <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-2">
                {item.citation}
              </span>
              <span className="shrink-0 font-mono tnum text-[12px] text-ink-3">
                {formatDuration(item.seconds)}
              </span>
              <span className="hidden shrink-0 font-mono tnum text-[12px] text-ink-3 sm:inline">
                {sinceLabel(item.at, reference)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
