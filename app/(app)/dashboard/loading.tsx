import { Skeleton } from "@/components/ui/feedback";
import { Surface } from "@/components/ui/surface";

/** Mirrors the launcher layout: recent work on the left, profile summary,
 *  filters and upload stacked on the right, all within one screen. */
export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-5 lg:h-[calc(100dvh-6rem)] lg:min-h-0 lg:overflow-hidden">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-3.5 w-[54ch] max-w-full" />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-12">
        <Surface className="flex min-h-0 flex-col lg:col-span-7">
          <div className="border-b border-line px-5 py-3.5">
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="border-b border-line px-5 py-3.5">
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="flex flex-col gap-3 px-5 py-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </Surface>

        <div className="flex min-h-0 flex-col gap-4 lg:col-span-5">
          <Surface className="shrink-0">
            <div className="flex items-center gap-4 px-4 py-3.5">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="ml-auto flex gap-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-10" />
                ))}
              </div>
            </div>
          </Surface>

          <Surface className="flex shrink-0 flex-col">
            <div className="border-b border-line px-5 py-3.5">
              <Skeleton className="h-4 w-52" />
            </div>
            <div className="flex flex-col gap-3 px-4 py-3.5">
              <div className="grid gap-2 sm:grid-cols-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
              {[5, 5, 4].map((chips, i) => (
                <div key={i} className="grid grid-cols-[4.25rem_1fr] gap-3">
                  <Skeleton className="h-3 w-12" />
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: chips }).map((_, chip) => (
                      <Skeleton key={chip} className="h-7 w-20 rounded-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-line px-4 py-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </Surface>

          <Surface className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-line px-5 py-3.5">
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex-1 p-4">
              <Skeleton className="h-full min-h-24 w-full" />
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
