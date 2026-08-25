import type { ReactNode } from "react";
import { cn, formatDelta } from "@/lib/utils";

interface StatProps {
  label: string;
  value: string;
  /** Signed change versus the previous period, in percentage points. */
  delta?: number;
  unit?: string;
  size?: "sm" | "lg" | "xl";
  className?: string;
}

const valueSizes = {
  sm: "text-xl",
  lg: "text-3xl",
  xl: "text-5xl",
} as const;

/** Hierarchy comes from scale, not from wrapping every metric in a card. */
export function Stat({
  label,
  value,
  delta,
  unit,
  size = "lg",
  className,
}: StatProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">
        {label}
      </span>
      <span className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-mono tnum font-medium tracking-[-0.03em] text-ink",
            valueSizes[size]
          )}
        >
          {value}
        </span>
        {unit ? <span className="text-sm text-ink-3">{unit}</span> : null}
        {typeof delta === "number" && delta !== 0 ? (
          <span
            className={cn(
              "font-mono tnum text-[13px]",
              delta > 0 ? "text-accent" : "text-ember"
            )}
          >
            {formatDelta(delta)}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/** Difficulty as five ticks. Reads faster than a number and needs no legend. */
export function DifficultyMeter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`Difficulty ${value} of 5`}
    >
      {[1, 2, 3, 4, 5].map((step) => (
        <span
          key={step}
          className={cn(
            "h-3 w-[3px] rounded-micro",
            step <= value ? "bg-accent" : "bg-line-strong"
          )}
        />
      ))}
    </span>
  );
}

/** Outcome is never signalled by color alone: glyph plus label always present. */
export function OutcomeBadge({
  outcome,
  className,
}: {
  outcome: "correct" | "incorrect" | "partial" | "skipped";
  className?: string;
}) {
  const map = {
    correct: { label: "Correct", glyph: "✓", tone: "text-accent bg-accent-soft" },
    incorrect: { label: "Missed", glyph: "✕", tone: "text-ember bg-ember-soft" },
    partial: { label: "Partial", glyph: "±", tone: "text-flag bg-flag-soft" },
    skipped: { label: "Skipped", glyph: "–", tone: "text-ink-3 bg-surface-3" },
  } as const;
  const entry = map[outcome];

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium",
        entry.tone,
        className
      )}
    >
      <span aria-hidden className="font-mono">
        {entry.glyph}
      </span>
      {entry.label}
    </span>
  );
}

export function Metric({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="text-[13px] text-ink-2">{label}</span>
      <span className="font-mono tnum text-[13px] text-ink">{children}</span>
    </div>
  );
}
