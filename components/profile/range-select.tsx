"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Segmented } from "@/components/ui/segmented";
import type { AnalyticsRange } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "7d" as const, label: "7 days" },
  { value: "30d" as const, label: "30 days" },
  { value: "all" as const, label: "All time" },
];

export function RangeSelect({ value }: { value: AnalyticsRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <Segmented
      label="Analytics range"
      value={value}
      options={OPTIONS}
      className={cn(pending && "opacity-55 transition-opacity duration-150")}
      onChange={(next) => {
        const search = new URLSearchParams(params.toString());
        if (next === "30d") search.delete("range");
        else search.set("range", next);
        const query = search.toString();
        startTransition(() => {
          router.replace(query ? `${pathname}?${query}` : pathname, {
            scroll: false,
          });
        });
      }}
    />
  );
}
