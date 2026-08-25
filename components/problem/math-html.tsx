import { cn } from "@/lib/utils";

/**
 * Renders math that was already typeset on the server by `renderMathHtml`.
 * The HTML comes from our own content pipeline, never directly from a user.
 */
export function MathHtml({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={cn("[&_.katex-display]:my-4", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
