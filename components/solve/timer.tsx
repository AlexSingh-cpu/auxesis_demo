"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/utils";

/** Isolated so the per-second tick never re-renders the solving surface. */
export function Timer({ running }: { running: boolean }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSeconds((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  return (
    <span
      className="font-mono tnum text-[13px] text-ink-3"
      aria-label={`Elapsed time ${formatDuration(seconds)}`}
    >
      {formatDuration(seconds)}
    </span>
  );
}
