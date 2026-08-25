import { Skeleton, SkeletonText } from "@/components/ui/feedback";

/** Mirrors the two-pane geometry so the layout does not jump on arrival. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-5 pb-8 pt-6 md:pt-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[58%_1fr] lg:items-start">
        <div className="flex flex-col gap-5">
          <SkeletonText lines={3} />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}
