import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SurfaceProps {
  children: ReactNode;
  className?: string;
  /** Panels sit flat by default. Elevation is reserved for true overlays. */
  inset?: boolean;
}

export function Surface({ children, className, inset }: SurfaceProps) {
  return (
    <section
      className={cn(
        "rounded-surface border border-line",
        inset ? "bg-surface-2" : "bg-surface",
        className
      )}
    >
      {children}
    </section>
  );
}

interface PanelHeaderProps {
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}

export function PanelHeader({
  title,
  hint,
  action,
  className,
}: PanelHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-baseline justify-between gap-4 border-b border-line px-5 py-3.5",
        className
      )}
    >
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          {title}
        </h2>
        {hint ? <p className="text-[13px] text-ink-3">{hint}</p> : null}
      </div>
      {action}
    </header>
  );
}

/** A hairline divider. Used instead of stacking bordered cards. */
export function Rule({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-line", className)} />;
}
