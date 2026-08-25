import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getStreak, profile } from "@/lib/mock/api";
import { DesktopNav } from "./nav";

export async function TopBar() {
  const streak = await getStreak();

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 md:px-6 lg:gap-6 lg:px-8">
        <Link
          href="/dashboard"
          className="font-display text-lg text-ink"
          aria-label="Margin, go to dashboard"
        >
          Margin
        </Link>

        <DesktopNav />

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {streak > 0 ? (
            <p className="hidden items-baseline gap-1.5 lg:flex">
              <span className="font-mono tnum text-sm font-medium text-ink">
                {streak}
              </span>
              <span className="text-[13px] text-ink-3">
                day{streak === 1 ? "" : "s"} running
              </span>
            </p>
          ) : null}

          <ThemeToggle />

          {/* Named, not just a monogram: the avatar alone did not read as the
              way into the profile. */}
          <Link
            href="/profile"
            className="flex h-10 items-center gap-2.5 rounded-control border border-line bg-surface-2 pl-1.5 pr-3 transition-colors duration-150 hover:border-line-strong hover:bg-surface-3"
          >
            <Avatar name={profile.name} size="sm" />
            <span className="hidden text-[13px] font-medium text-ink sm:inline">
              {profile.name.split(" ")[0]}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
