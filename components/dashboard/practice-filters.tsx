"use client";

import { useCallback, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buttonStyles } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Select } from "@/components/ui/field";
import { QUEUE_KEYS } from "@/lib/queue";
import { cn, formatMinutes } from "@/lib/utils";

export interface ChipOption {
  value: string;
  label: string;
  count: number;
}

interface PracticeFiltersProps {
  textbooks: { value: string; label: string }[];
  topicGroups: { strand: string; topics: { value: string; label: string }[] }[];
  difficulties: ChipOption[];
  kinds: ChipOption[];
  statuses: ChipOption[];
  matchCount: number;
  minutes: number;
}

/** Declared at module scope: defining it inside the parent would remount every
 *  chip on each render and throw away their state. */
function ChipRow({
  label,
  options,
  chosen,
  onToggle,
}: {
  label: string;
  options: ChipOption[];
  chosen: Set<string>;
  onToggle: (value: string) => void;
}) {
  return (
    // Label beside the chips rather than above them. Three stacked label lines
    // were the bulk of this panel's height.
    <div className="grid grid-cols-[4.25rem_1fr] items-start gap-3">
      <p className="pt-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <Chip
            key={option.value}
            selected={chosen.has(option.value)}
            count={option.count}
            onClick={() => onToggle(option.value)}
            className={cn(
              "h-7 px-2.5 text-[12px]",
              option.count === 0 && !chosen.has(option.value) && "opacity-45"
            )}
          >
            {option.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

export function PracticeFilters({
  textbooks,
  topicGroups,
  difficulties,
  kinds,
  statuses,
  matchCount,
  minutes,
}: PracticeFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const navigate = useCallback(
    (next: URLSearchParams) => {
      const query = next.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router]
  );

  const setSingle = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      navigate(next);
    },
    [navigate, params]
  );

  const toggle = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      const chosen = new Set(
        (params.get(key) ?? "").split(",").filter(Boolean)
      );
      if (chosen.has(value)) chosen.delete(value);
      else chosen.add(value);

      if (chosen.size > 0) next.set(key, [...chosen].join(","));
      else next.delete(key);
      navigate(next);
    },
    [navigate, params]
  );

  const chosenIn = (key: string) =>
    new Set((params.get(key) ?? "").split(",").filter(Boolean));

  // Scoped to the queue keys, so an unrelated search param never makes
  // "Clear" appear when there is nothing of this panel's to clear.
  const anyActive = Object.values(QUEUE_KEYS).some((key) =>
    Boolean(params.get(key))
  );
  const query = params.toString();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3.5",
          "transition-opacity duration-150",
          pending && "opacity-55"
        )}
      >
        {/* The default option carries the label, so no separate caption row. */}
        <div className="grid gap-2 sm:grid-cols-2">
          <Select
            aria-label="Textbook"
            value={params.get("book") ?? ""}
            onChange={(event) => setSingle("book", event.target.value)}
            className="h-9 text-[13px]"
          >
            <option value="">All textbooks</option>
            {textbooks.map((book) => (
              <option key={book.value} value={book.value}>
                {book.label}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Topic"
            value={params.get("topic") ?? ""}
            onChange={(event) => setSingle("topic", event.target.value)}
            className="h-9 text-[13px]"
          >
            <option value="">All topics</option>
            {topicGroups.map((group) => (
              <optgroup key={group.strand} label={group.strand}>
                {group.topics.map((topic) => (
                  <option key={topic.value} value={topic.value}>
                    {topic.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </div>

        <ChipRow
          label="Level"
          options={difficulties}
          chosen={chosenIn("d")}
          onToggle={(value) => toggle("d", value)}
        />
        <ChipRow
          label="Type"
          options={kinds}
          chosen={chosenIn("kind")}
          onToggle={(value) => toggle("kind", value)}
        />
        <ChipRow
          label="Status"
          options={statuses}
          chosen={chosenIn("status")}
          onToggle={(value) => toggle("status", value)}
        />
      </div>

      <div className="flex items-center gap-3 border-t border-line px-4 py-3">
        <p className="text-[13px] text-ink-2">
          <span className="font-mono tnum text-base font-medium text-ink">
            {matchCount}
          </span>{" "}
          problems
          {matchCount > 0 ? (
            <span className="hidden text-ink-3 sm:inline">
              {" "}
              · {formatMinutes(minutes)}
            </span>
          ) : null}
        </p>

        <div className="ml-auto flex items-center gap-2">
          {anyActive ? (
            <button
              type="button"
              onClick={() =>
                startTransition(() =>
                  router.replace(pathname, { scroll: false })
                )
              }
              className="text-[13px] font-medium text-ink-3 transition-colors duration-150 hover:text-ink"
            >
              Clear
            </button>
          ) : null}

          {matchCount > 0 ? (
            <Link
              href={query ? `/solve?${query}` : "/solve"}
              className={buttonStyles("primary", "md")}
            >
              Start practice
            </Link>
          ) : (
            <span
              aria-disabled
              className={cn(
                buttonStyles("primary", "md"),
                "pointer-events-none opacity-45"
              )}
            >
              Start practice
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
