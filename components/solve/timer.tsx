"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { formatDuration } from "@/lib/utils";

export interface TimerHandle {
  getSeconds: () => number;
}

interface TimerProps {
  running: boolean;
}

/** Isolated so the per-second tick never re-renders the solving surface.
 *  Elapsed time is exposed imperatively via ref rather than a prop, so a
 *  parent reading it on submit is never itself subscribed to the tick. */
export const Timer = forwardRef<TimerHandle, TimerProps>(function Timer(
  { running },
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
      className="font-mono tnum text-[13px] text-ink-3"
      aria-label={`Elapsed time ${formatDuration(seconds)}`}
    >
      {formatDuration(seconds)}
    </span>
  );
});
