import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Skeletons mirror the geometry of what they replace. Never a spinner. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-control bg-surface-2",
        className
      )}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3.5", i === lines - 1 ? "w-2/5" : "w-full")}
        />
      ))}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}

/** Empty states are composed, not apologetic. They name what will appear here
 *  and offer the action that produces it. */
export function EmptyState({ title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "grid-paper flex flex-col items-center justify-center gap-3 rounded-control",
        "border border-dashed border-line px-6 py-12 text-center",
        className
      )}
    >
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <p className="max-w-[46ch] text-[13px] leading-relaxed text-ink-2">
        {body}
      </p>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

export function ErrorNote({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-control border border-ember/40 bg-ember-soft px-4 py-3.5">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="text-[13px] leading-relaxed text-ink-2">{body}</p>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
