"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const AUTOSAVE_MS = 500;

function storageKey(problemId: string) {
  return `margin-notes-${problemId}`;
}

/**
 * Working scratchpad, one per problem. The textarea is uncontrolled and hydrated
 * from storage through a ref, which avoids both a hydration mismatch and a
 * re-render on every keystroke.
 */
export function NotesPad({
  problemId,
  className,
}: {
  problemId: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    try {
      node.value = window.localStorage.getItem(storageKey(problemId)) ?? "";
    } catch {
      node.value = "";
    }
    setSaved(false);

    return () => {
      window.clearTimeout(timer.current);
    };
  }, [problemId]);

  const handleChange = useCallback(() => {
    window.clearTimeout(timer.current);
    setSaved(false);
    timer.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          storageKey(problemId),
          ref.current?.value ?? ""
        );
        setSaved(true);
      } catch {
        // Private browsing can block storage. Notes stay in the textarea for
        // the current session either way.
      }
    }, AUTOSAVE_MS);
  }, [problemId]);

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor="solve-notes"
          className="text-[13px] font-medium text-ink-2"
        >
          Working notes
        </label>
        <span
          aria-live="polite"
          className="font-mono text-[11px] text-ink-3"
        >
          {saved ? "Saved" : ""}
        </span>
      </div>
      <textarea
        id="solve-notes"
        ref={ref}
        onChange={handleChange}
        spellCheck={false}
        placeholder={"u = cos x\ndu = -sin x dx"}
        className={cn(
          "min-h-40 flex-1 resize-none rounded-control border border-line bg-surface-2 p-3",
          "font-mono text-[13px] leading-relaxed text-ink placeholder:text-ink-3",
          "transition-colors duration-150 focus:border-accent focus:outline-none"
        )}
      />
    </div>
  );
}
