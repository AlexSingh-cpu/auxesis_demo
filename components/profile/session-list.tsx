import type { SessionSummary } from "@/lib/types";
import { formatDate, formatMinutes, formatPercent } from "@/lib/utils";

/** One row per study day. The bar is scaled to the busiest day in view, so the
 *  shape of the week is legible without an axis. */
export function SessionList({ sessions }: { sessions: SessionSummary[] }) {
  const busiest = Math.max(...sessions.map((s) => s.attempted), 1);

  return (
    <ul className="flex flex-col">
      {[...sessions].reverse().map((session) => {
        const accuracy =
          session.attempted === 0
            ? 0
            : (session.correct / session.attempted) * 100;

        return (
          <li
            key={session.date}
            className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-x-4 gap-y-1 border-b border-line px-5 py-3 last:border-0 sm:grid-cols-[4.5rem_1fr_auto_auto]"
          >
            <span className="font-mono text-[13px] text-ink-2">
              {formatDate(session.date)}
            </span>

            <span className="flex items-center gap-2.5">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                <span
                  className="block h-full rounded-full bg-accent/70"
                  style={{ width: `${(session.attempted / busiest) * 100}%` }}
                />
              </span>
              <span className="shrink-0 font-mono tnum text-[12px] text-ink-3">
                {session.correct}/{session.attempted}
              </span>
            </span>

            <span className="font-mono tnum text-[13px] text-ink">
              {formatPercent(accuracy, 0)}
            </span>

            <span className="hidden font-mono tnum text-[12px] text-ink-3 sm:inline">
              {formatMinutes(session.minutes)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
