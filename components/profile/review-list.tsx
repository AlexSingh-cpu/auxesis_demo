import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { DifficultyMeter } from "@/components/ui/stat";
import type { ReviewItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

/** Problems you have missed more than once, hardest-hit first. These are the
 *  ones worth a second pass. */
export function ReviewList({ items }: { items: ReviewItem[] }) {
  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <li key={item.problemId} className="border-b border-line last:border-0">
          <Link
            href={`/solve/${item.problemId}`}
            className="group flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-surface-2"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-[13px] text-ink">{item.label}</span>
              <span className="flex items-center gap-2.5">
                <span className="text-[12px] text-ink-3">{item.topicName}</span>
                <DifficultyMeter value={item.difficulty} />
              </span>
            </div>
            <span className="shrink-0 text-right">
              <span className="block font-mono tnum text-[13px] text-ember">
                {item.misses}
                <span className="pl-1 text-[11px] text-ink-3">
                  miss{item.misses === 1 ? "" : "es"}
                </span>
              </span>
              <span className="block font-mono text-[11px] text-ink-3">
                {formatDate(item.lastMissedAt)}
              </span>
            </span>
            <ArrowRightIcon
              size={15}
              className="shrink-0 text-ink-3 transition-transform duration-150 ease-[var(--ease-out-quint)] group-hover:translate-x-0.5 group-hover:text-accent"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
