import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FunnelIcon } from "@phosphor-icons/react/ssr";
import { PageHeader } from "@/components/shell/page-header";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { getQueue } from "@/lib/mock/api";
import { hasActiveFilters, parseQueueSpec, solveHref } from "@/lib/queue";

export const metadata: Metadata = {
  title: "Solve",
};

export default async function SolvePage(props: PageProps<"/solve">) {
  const params = await props.searchParams;
  const queue = await getQueue(parseQueueSpec(params));

  // /solve is an entry point, not a destination: it hands you the first problem
  // and carries the queue spec along so the session stays inside your filters.
  if (queue.length > 0) redirect(solveHref(queue[0].id, params));

  const filtered = hasActiveFilters(params);

  return (
    <>
      <PageHeader
        title="Solve"
        description="Work through your queue one problem at a time, with room to show your working."
      />

      <EmptyState
        title={filtered ? "No problems match those filters" : "Nothing queued right now"}
        body={
          filtered
            ? "Nothing in your library fits every filter you picked. Loosen one of them, or upload another chapter to widen the pool."
            : "Choose the topics, difficulty, and problem types you want to practice. We will build a queue and drop you straight into the first problem."
        }
        action={
          <Link href="/dashboard" className={buttonStyles("primary")}>
            <FunnelIcon size={16} />
            {filtered ? "Adjust filters" : "Build a queue"}
          </Link>
        }
        className="py-20"
      />
    </>
  );
}
