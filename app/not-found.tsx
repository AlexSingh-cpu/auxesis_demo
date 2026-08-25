import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid-paper flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <p className="font-mono text-[13px] text-ink-3">404</p>
      <h1 className="font-display text-3xl text-ink md:text-4xl">
        That page does not exist
      </h1>
      <p className="max-w-[52ch] text-[15px] leading-relaxed text-ink-2">
        The link may be out of date, or the problem you were looking for is no
        longer in your library.
      </p>
      <Link href="/dashboard" className={buttonStyles("primary", "md", "mt-2")}>
        Back to dashboard
      </Link>
    </div>
  );
}
