import { cn, initialsOf } from "@/lib/utils";

const sizes = {
  sm: "size-7 text-[11px]",
  md: "size-9 text-[13px]",
  lg: "size-14 text-lg",
} as const;

/** A monogram in the accent color, never a stock silhouette. */
export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        "border border-accent/30 bg-accent-soft font-medium text-accent",
        sizes[size],
        className
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
