"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { cn, formatDuration } from "@/lib/utils";

export interface TimerHandle {
  getSeconds: () => number;
}

interface TimerProps {
  running: boolean;
  /** Recording stays on regardless — this only controls the visible digits,
   *  so a count-up clock can't pressure a student stuck on a hard problem.
   *  The element stays in the DOM with its aria-label, just visually hidden,
   *  so the value is still available to a screen reader. */
  hidden?: boolean;
}

/** Isolated so the per-second tick never re-renders the solving surface.
 *  Elapsed time is exposed imperatively via ref rather than a prop, so a
 *  parent reading it on submit is never itself subscribed to the tick. */
export const Timer = forwardRef<TimerHandle, TimerProps>(function Timer(
  { running, hidden },
  ref
) {
  const [seconds, setSeconds] = useState(0);
  const secondsRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useImperativeHandle(ref, () => ({
    getSeconds: () => secondsRef.current,
  }), []);

  return (
    <span
      className={cn("font-mono tnum text-[13px] text-ink-3", hidden && "sr-only")}
      aria-label={`Elapsed time ${formatDuration(seconds)}`}
    >
      {formatDuration(seconds)}
    </span>
  );
});
