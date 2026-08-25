import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const controlBase =
  "w-full rounded-control border bg-surface-2 px-3 text-sm text-ink " +
  "placeholder:text-ink-3 transition-colors duration-150 " +
  "focus:border-accent focus:outline-none focus-visible:outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-50";

interface FieldProps {
  label: string;
  htmlFor: string;
  /** Rendered in markup even when empty so the layout never shifts on error. */
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

/** Label above, control, then hint or error below. Placeholders are never labels. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={htmlFor}
        className="text-[13px] font-medium text-ink-2"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-[13px] text-ember">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[13px] text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  mono?: boolean;
}

export function Input({ className, invalid, mono, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        controlBase,
        "h-10",
        invalid ? "border-ember" : "border-line",
        mono && "font-mono tnum",
        className
      )}
      {...props}
    />
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  mono?: boolean;
}

export function TextArea({ className, invalid, mono, ...props }: TextAreaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        controlBase,
        "resize-y py-2.5 leading-relaxed",
        invalid ? "border-ember" : "border-line",
        mono && "font-mono",
        className
      )}
      {...props}
    />
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ className, invalid, children, ...props }: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(
        controlBase,
        "h-10 appearance-none pr-8",
        invalid ? "border-ember" : "border-line",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
