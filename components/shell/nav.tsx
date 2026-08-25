"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MathOperationsIcon,
  SquaresFourIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard", Icon: SquaresFourIcon },
  { href: "/solve", label: "Solve", Icon: MathOperationsIcon },
  { href: "/profile", label: "Profile", Icon: UserIcon },
] as const;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * A raised segmented control rather than bare text links. The earlier version
 * was three muted words beside the wordmark and readers did not register it as
 * navigation at all.
 */
export function DesktopNav() {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Primary"
      className="hidden items-center gap-1 rounded-control border border-line bg-surface-2 p-1 md:flex"
    >
      {ITEMS.map(({ href, label, Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-2 rounded-micro px-3.5 text-[13px] font-medium",
              "transition-colors duration-150",
              active
                ? "bg-surface text-ink shadow-[0_1px_2px_rgb(0_0_0/0.18)]"
                : "text-ink-2 hover:text-ink"
            )}
          >
            <Icon size={16} weight={active ? "fill" : "regular"} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileTabBar() {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 backdrop-blur-md md:hidden",
        "pb-[max(0.25rem,env(safe-area-inset-bottom))]"
      )}
    >
      <ul className="grid grid-cols-3">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                  "transition-colors duration-150",
                  active ? "text-accent" : "text-ink-2"
                )}
              >
                <Icon size={20} weight={active ? "fill" : "regular"} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
