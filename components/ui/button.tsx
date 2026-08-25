import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "quiet";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium " +
  "transition-[background-color,border-color,color,transform] duration-150 " +
  "ease-[var(--ease-out-quint)] active:scale-[0.98] " +
  "disabled:pointer-events-none disabled:opacity-45";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-contrast hover:bg-accent-hover",
  secondary:
    "border border-line bg-surface-2 text-ink hover:border-line-strong hover:bg-surface-3",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
  quiet: "text-accent hover:bg-accent-soft",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export function buttonStyles(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles(variant, size, className)}
      {...props}
    />
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Required: these buttons never carry a visible text label. */
  label: string;
}

export function IconButton({
  variant = "ghost",
  label,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        base,
        variants[variant],
        "size-9 shrink-0 p-0",
        className
      )}
      {...props}
    />
  );
}
