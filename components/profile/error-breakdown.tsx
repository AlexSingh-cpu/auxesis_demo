import type { ErrorBreakdownEntry, ErrorKind } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

const LABELS: Record<ErrorKind, { label: string; hint: string }> = {
  conceptual: { label: "Concept", hint: "Did not know the method" },
  arithmetic: { label: "Arithmetic", hint: "Right method, slipped" },
  setup: { label: "Setup", hint: "Wrong starting equation" },
  incomplete: { label: "Incomplete", hint: "Ran out of steps" },
};

/** The diagnostic panel. Knowing you miss 40% is useless next to knowing that
 *  most of those misses are arithmetic rather than conceptual. */
export function ErrorBreakdown({
  entries,
}: {
  entries: ErrorBreakdownEntry[];
}) {
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);

  if (total === 0) {
    return (
      <p className="px-5 py-10 text-center text-[13px] text-ink-3">
        No misses recorded in this range.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3.5 p-5">
      {entries.map((entry) => {
        const share = (entry.count / total) * 100;
        return (
          <li key={entry.kind} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] text-ink">
                {LABELS[entry.kind].label}
                <span className="pl-2 text-[12px] text-ink-3">
                  {LABELS[entry.kind].hint}
                </span>
              </span>
              <span className="shrink-0 font-mono tnum text-[13px] text-ink">
                {formatPercent(share, 0)}
                <span className="pl-2 text-[12px] text-ink-3">
                  {entry.count}
                </span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-ember/80"
                style={{ width: `${share}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
