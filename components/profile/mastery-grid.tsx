import type { MasteryCell } from "@/lib/types";
import { cn, formatPercent } from "@/lib/utils";

function tone(accuracy: number) {
  if (accuracy < 50) return "var(--ember)";
  if (accuracy < 70) return "var(--flag)";
  return "var(--accent)";
}

/** Confidence, not just score: a cell fades toward the background when it rests
 *  on very few attempts, so two lucky answers never look like mastery. */
function confidence(attempted: number) {
  return Math.min(1, 0.22 + (attempted / 10) * 0.78);
}

export function MasteryGrid({ cells }: { cells: MasteryCell[] }) {
  const topics = [...new Map(cells.map((c) => [c.topicId, c.topicName]))];

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="overflow-x-auto">
        <div className="min-w-[26rem]">
          <div className="grid grid-cols-[minmax(8rem,1fr)_repeat(5,minmax(2rem,2.5rem))] items-center gap-1">
            <span />
            {[1, 2, 3, 4, 5].map((level) => (
              <span
                key={level}
                className="text-center font-mono text-[11px] text-ink-3"
              >
                {level}
              </span>
            ))}

            {topics.map(([topicId, topicName]) => (
              <Row
                key={topicId}
                name={topicName}
                cells={cells.filter((cell) => cell.topicId === topicId)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-ink-3">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-micro" style={{ background: "var(--ember)" }} />
          under 50%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-micro" style={{ background: "var(--flag)" }} />
          50 to 70%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-micro" style={{ background: "var(--accent)" }} />
          over 70%
        </span>
        <span>Faded cells rest on few attempts.</span>
      </div>
    </div>
  );
}

function Row({ name, cells }: { name: string; cells: MasteryCell[] }) {
  return (
    <>
      <span className="truncate pr-3 text-[13px] text-ink-2" title={name}>
        {name}
      </span>
      {[1, 2, 3, 4, 5].map((level) => {
        const cell = cells.find((c) => c.difficulty === level);
        const attempted = cell?.attempted ?? 0;

        if (attempted === 0) {
          return (
            <span
              key={level}
              title={`${name}, difficulty ${level}: not attempted`}
              className="h-7 rounded-micro border border-dashed border-line"
            />
          );
        }

        return (
          <span
            key={level}
            title={`${name}, difficulty ${level}: ${formatPercent(
              cell!.accuracy
            )} over ${attempted} attempt${attempted === 1 ? "" : "s"}`}
            className={cn("h-7 rounded-micro")}
            style={{
              background: tone(cell!.accuracy),
              opacity: confidence(attempted),
            }}
          />
        );
      })}
    </>
  );
}
