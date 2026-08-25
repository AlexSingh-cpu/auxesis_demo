import Link from "next/link";
import { CaretRightIcon } from "@phosphor-icons/react/ssr";
import { Avatar } from "@/components/ui/avatar";
import type { LifetimeStats, UserProfile } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

/** Running totals, and a way through to the full analytics. Deliberately has no
 *  panel header: on a single-screen layout that bar would cost more height than
 *  the numbers it introduces. */
export function ProfileSnapshot({
  profile,
  lifetime,
  streakDays,
}: {
  profile: UserProfile;
  lifetime: LifetimeStats;
  streakDays: number;
}) {
  const figures = [
    { label: "Solved", value: String(lifetime.solved) },
    { label: "Correct", value: formatPercent(lifetime.accuracy, 0) },
    { label: "Streak", value: String(streakDays) },
  ];

  return (
    <Link
      href="/profile"
      className="group flex items-center gap-4 px-4 py-3.5 transition-colors duration-150 hover:bg-surface-2"
    >
      <Avatar name={profile.name} size="md" />

      <div className="flex min-w-0 flex-col">
        <span className="truncate text-[13px] font-medium text-ink">
          {profile.name}
        </span>
        <span className="truncate text-[12px] text-ink-3">
          {lifetime.mastered} mastered
        </span>
      </div>

      <dl className="ml-auto flex items-center gap-4 sm:gap-5">
        {figures.map((figure) => (
          <div key={figure.label} className="flex flex-col items-end">
            <dd className="font-mono tnum text-[15px] font-medium text-ink">
              {figure.value}
            </dd>
            <dt className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-3">
              {figure.label}
            </dt>
          </div>
        ))}
      </dl>

      <CaretRightIcon
        size={14}
        className="shrink-0 text-ink-3 transition-transform duration-150 ease-[var(--ease-out-quint)] group-hover:translate-x-0.5 group-hover:text-accent"
      />
    </Link>
  );
}
