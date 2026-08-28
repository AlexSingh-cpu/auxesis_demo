import { Skeleton } from "@/components/ui/feedback";

/** Covers the brief window before this either redirects into a problem or
 *  settles on the empty state — the outcome isn't known yet, so this mirrors
 *  neither exactly and just holds the page header's shape steady. */
export default function SolveLoading() {
  return (
    <>
      <div className="flex flex-col gap-5 pb-8 pt-8 md:pt-10">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      </div>

      <div className="grid-paper flex flex-col items-center justify-center gap-3 rounded-control border border-dashed border-line px-6 py-20">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-3 w-72 max-w-full" />
      </div>
    </>
  );
}
