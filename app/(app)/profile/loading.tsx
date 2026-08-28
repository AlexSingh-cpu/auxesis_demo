import { Skeleton } from "@/components/ui/feedback";
import { Surface } from "@/components/ui/surface";

function PanelHeaderSkeleton({ width = "w-32" }: { width?: string }) {
  return (
    <div className="border-b border-line px-5 py-3.5">
      <Skeleton className={`h-4 ${width}`} />
    </div>
  );
}

/** Mirrors the panel stack so nothing shifts when the real data arrives. */
export default function ProfileLoading() {
  return (
    <>
      <header className="flex flex-col gap-5 pb-7 pt-8 sm:flex-row sm:items-center md:pt-10">
        <Skeleton className="size-14 shrink-0 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-9 w-56 sm:ml-auto" />
      </header>

      <div className="flex flex-col gap-6 pb-4">
        <Surface>
          <PanelHeaderSkeleton width="w-24" />
          <div className="grid grid-cols-2 gap-6 p-5 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </Surface>

        <Surface>
          <PanelHeaderSkeleton width="w-40" />
          <Skeleton className="m-5 h-40" />
        </Surface>

        <Surface>
          <PanelHeaderSkeleton width="w-20" />
          <Skeleton className="m-5 h-48" />
        </Surface>

        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Surface key={i}>
              <PanelHeaderSkeleton />
              <Skeleton className="m-5 h-32" />
            </Surface>
          ))}
        </div>

        <Surface>
          <PanelHeaderSkeleton width="w-32" />
          <div className="flex flex-col gap-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </Surface>
      </div>
    </>
  );
}
