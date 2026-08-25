import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { MathHtml } from "@/components/problem/math-html";
import { DifficultyMeter } from "@/components/ui/stat";
import type { QueuedProblem } from "@/lib/types";

const STATUS_NOTE: Partial<
  Record<QueuedProblem["status"], { label: string; tone: string }>
> = {
  missed: { label: "Missed before", tone: "text-ember" },
  flagged: { label: "Flagged", tone: "text-flag" },
  mastered: { label: "Mastered", tone: "text-ink-3" },
};

/**
 * One problem in a list you have not solved yet. Shows the citation and the
 * problem itself but none of our classification, matching the solve screen:
 * naming the topic here would hand over the method one click early.
 */
export function ProblemRow({
  problem,
  href,
}: {
  problem: QueuedProblem;
  href: string;
}) {
  const note = STATUS_NOTE[problem.status];

  return (
    <li className="border-b border-line last:border-0">
      <Link
        href={href}
        className="group flex items-start gap-4 px-5 py-4 transition-colors duration-150 hover:bg-surface-2"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <MathHtml
            html={problem.bodyHtml}
            className="line-clamp-2 text-sm leading-relaxed text-ink [&_.katex-display]:my-0"
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="font-mono text-[12px] text-ink-3">
              {problem.citation}
            </span>
            <DifficultyMeter value={problem.difficulty} />
            <span className="text-[12px] text-ink-3">
              about {problem.estimatedMinutes} min
            </span>
            {note ? (
              <span className={`text-[12px] ${note.tone}`}>{note.label}</span>
            ) : null}
          </div>
        </div>
        <ArrowRightIcon
          size={16}
          className="mt-0.5 shrink-0 text-ink-3 transition-transform duration-150 ease-[var(--ease-out-quint)] group-hover:translate-x-0.5 group-hover:text-accent"
        />
      </Link>
    </li>
  );
}
