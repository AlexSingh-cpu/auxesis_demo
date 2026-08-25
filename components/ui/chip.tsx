import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  count?: number;
}

/** Chips are the only fully-rounded shape in the system. */
export function Chip({
  selected,
  count,
  className,
  children,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[13px] font-medium",
        "transition-[background-color,border-color,color,transform] duration-150",
        "ease-[var(--ease-out-quint)] active:translate-y-px",
        selected
          ? "border-accent bg-accent-soft text-accent"
          : "border-line bg-surface-2 text-ink-2 hover:border-line-strong hover:text-ink",
        className
      )}
      {...props}
    >
      {children}
      {typeof count === "number" ? (
        <span className="font-mono tnum text-[11px] text-ink-3">{count}</span>
      ) : null}
    </button>
  );
}

/** Non-interactive descriptor, used for problem classification. */
export function Tag({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border border-line bg-surface-2 px-2.5",
        "text-[12px] text-ink-2",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Shortcut({ children }: { children: ReactNode }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-line",
        "bg-surface-3 px-1.5 font-mono text-[11px] text-ink-3"
      )}
    >
      {children}
    </kbd>
  );
}
