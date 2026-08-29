import { Skeleton } from "@/components/ui/feedback";
import { PanelHeader, Surface } from "@/components/ui/surface";

/** Mirrors the panel stack so nothing shifts when the real recap arrives. */
export default function RecapLoading() {
  return (
    <>
      <div className="flex flex-col gap-5 pb-8 pt-8 md:pt-10">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      </div>

      <div className="flex flex-col gap-6 pb-8">
        <Surface>
          <PanelHeader title="This session" />
          <div className="grid grid-cols-2 gap-6 p-5 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
          <div className="border-t border-line p-5">
            <Skeleton className="h-8 w-full" />
          </div>
        </Surface>

        <Skeleton className="h-10 w-64" />
      </div>
    </>
  );
}
