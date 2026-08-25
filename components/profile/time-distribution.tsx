import type { TimeBucket } from "@/lib/types";

/** How long problems actually take you. A pile in the slowest bucket means
 *  something different from a pile in the fastest one. */
export function TimeDistribution({ buckets }: { buckets: TimeBucket[] }) {
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const tallest = Math.max(...buckets.map((bucket) => bucket.count), 1);

  if (total === 0) {
    return (
      <p className="px-5 py-10 text-center text-[13px] text-ink-3">
        No timed attempts in this range.
      </p>
    );
  }

  return (
    <div className="flex items-end gap-2 p-5" style={{ height: "12.5rem" }}>
      {buckets.map((bucket) => {
        const share = (bucket.count / total) * 100;
        return (
          <div
            key={bucket.label}
            className="flex flex-1 flex-col items-center gap-2"
            title={`${bucket.count} attempts took ${bucket.label}`}
          >
            <span className="font-mono tnum text-[12px] text-ink-2">
              {bucket.count}
            </span>
            <span
              className="w-full rounded-micro bg-accent/70"
              style={{
                height: `${Math.max((bucket.count / tallest) * 100, 2)}%`,
              }}
            />
            <span className="font-mono text-[11px] text-ink-3">
              {bucket.label}
            </span>
            <span className="font-mono text-[10px] text-ink-3">
              {share.toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
