import type { TrendPoint } from "@/lib/types";
import { formatDate, formatPercent } from "@/lib/utils";

const W = 720;
const H = 180;
const PAD_Y = 14;

/**
 * Accuracy per study day. Drawn as straight segments rather than a smoothed
 * curve, because interpolating between daily points would invent readings that
 * were never taken.
 */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length < 2) {
    return (
      <p className="px-5 py-10 text-center text-[13px] text-ink-3">
        Two study days are needed before a trend means anything.
      </p>
    );
  }

  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (accuracy: number) =>
    H - PAD_Y - (accuracy / 100) * (H - PAD_Y * 2);

  const line = points.map((p, i) => `${x(i)},${y(p.accuracy)}`).join(" ");
  const area = `${x(0)},${H} ${line} ${x(points.length - 1)},${H}`;

  const best = points.reduce((a, b) => (b.accuracy > a.accuracy ? b : a));
  const worst = points.reduce((a, b) => (b.accuracy < a.accuracy ? b : a));

  return (
    <div className="flex flex-col gap-3 p-5">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-40 w-full"
        role="img"
        aria-label={`Accuracy per day, from ${formatPercent(
          points[0].accuracy
        )} to ${formatPercent(points[points.length - 1].accuracy)}`}
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Reference lines at 50 and 100 percent. */}
        {[50, 100].map((value) => (
          <line
            key={value}
            x1={0}
            x2={W}
            y1={y(value)}
            y2={y(value)}
            stroke="var(--line)"
            strokeWidth={1}
            strokeDasharray={value === 100 ? undefined : "3 4"}
          />
        ))}

        <polygon points={area} fill="url(#trend-fill)" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((point, i) => (
          <circle
            key={point.date}
            cx={x(i)}
            cy={y(point.accuracy)}
            r={2.5}
            fill="var(--bg)"
            stroke="var(--accent)"
            strokeWidth={1.5}
          >
            <title>
              {`${formatDate(point.date)} · ${formatPercent(
                point.accuracy
              )} · ${point.attempted} attempted`}
            </title>
          </circle>
        ))}
      </svg>

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-[12px] text-ink-3">
        <span className="font-mono">{formatDate(points[0].date)}</span>
        <span>
          best {formatPercent(best.accuracy, 0)} on {formatDate(best.date)} ·
          worst {formatPercent(worst.accuracy, 0)} on {formatDate(worst.date)}
        </span>
        <span className="font-mono">
          {formatDate(points[points.length - 1].date)}
        </span>
      </div>
    </div>
  );
}
