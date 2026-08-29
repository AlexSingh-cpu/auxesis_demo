"use client";

import { useState, useTransition } from "react";
import { setAttemptErrorKind } from "@/app/(app)/solve/actions";
import { Chip } from "@/components/ui/chip";
import { ERROR_KINDS } from "@/lib/error-kinds";
import type { Attempt, ErrorKind } from "@/lib/types";

interface RecapMissListProps {
  misses: Attempt[];
  /** Keyed by attempt id, since a spoiler-safe citation is the only thing
   *  worth showing here — the point is which problem, not its content. */
  citations: Record<string, string>;
}

/** The payoff for keeping the inline error-kind chip optional (PLAN.md step
 *  4): whatever a miss left unclassified in the moment gets one more chance
 *  here, at the end of the session rather than gated on advancing. */
export function RecapMissList({ misses, citations }: RecapMissListProps) {
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const remaining = misses.filter((miss) => !resolved.has(miss.id));
  if (remaining.length === 0) return null;

  function classify(attemptId: string, kind: ErrorKind) {
    setResolved((prev) => new Set(prev).add(attemptId));
    startTransition(() => {
      void setAttemptErrorKind(attemptId, kind);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {remaining.map((miss) => (
        <div
          key={miss.id}
          className="flex flex-col gap-2.5 rounded-control border border-line bg-surface-2 p-3.5"
        >
          <p className="font-mono text-[12px] text-ink-3">
            {citations[miss.id] ?? miss.problemId}
          </p>
          <div className="flex flex-wrap gap-2">
            {ERROR_KINDS.map((entry) => (
              <Chip
                key={entry.kind}
                title={entry.hint}
                onClick={() => classify(miss.id, entry.kind)}
              >
                {entry.label}
              </Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
