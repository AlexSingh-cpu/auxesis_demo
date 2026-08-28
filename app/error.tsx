"use client";

import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

/**
 * Catches anything under (app)/ that doesn't have its own nested error.tsx
 * (dashboard and profile do; this backstops solve and anything added later).
 * Does not catch errors in the root layout itself — that needs
 * global-error.tsx, which replaces the whole document and isn't warranted
 * here.
 */
export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid-paper flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <p className="font-mono text-[13px] text-ink-3">Error</p>
      <h1 className="font-display text-3xl text-ink md:text-4xl">
        Something went wrong
      </h1>
      <p className="max-w-[52ch] text-[15px] leading-relaxed text-ink-2">
        Your problems and attempts are safe. This is a display problem on our
        side.
      </p>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={reset}
          className={buttonStyles("secondary", "md")}
        >
          Try again
        </button>
        <Link href="/dashboard" className={buttonStyles("primary", "md")}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
