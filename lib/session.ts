import type { Attempt } from "@/lib/types";

const DEFAULT_GAP_MS = 30 * 60 * 1000;

/** A "session" has no explicit id — it is the trailing run of attempts back
 *  to the most recent gap wider than `gapMs`. Pure and clock-independent: it
 *  only compares attempts against each other, never against wall-clock time,
 *  so it stays correct no matter when it is called. */
export function selectSessionAttempts(
  attempts: Attempt[],
  gapMs: number = DEFAULT_GAP_MS
): Attempt[] {
  const sorted = [...attempts].sort((a, b) =>
    a.at < b.at ? -1 : a.at > b.at ? 1 : 0
  );

  let start = sorted.length - 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    const gap = new Date(sorted[i].at).getTime() - new Date(sorted[i - 1].at).getTime();
    if (gap > gapMs) break;
    start = i - 1;
  }

  return sorted.slice(start);
}
