import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 pb-8 pt-8 md:flex-row md:items-end md:justify-between md:gap-8 md:pt-10",
        className
      )}
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl text-ink md:text-4xl">{title}</h1>
        {description ? (
          <p className="max-w-[62ch] text-[15px] leading-relaxed text-ink-2">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 gap-3">{action}</div> : null}
    </div>
  );
}
