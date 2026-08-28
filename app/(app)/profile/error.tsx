"use client";

import { Button } from "@/components/ui/button";
import { ErrorNote } from "@/components/ui/feedback";
import { PageHeader } from "@/components/shell/page-header";

export default function ProfileError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <PageHeader title="Profile" />
      <ErrorNote
        title="We could not load your analytics"
        body="Your attempt history is safe. This is a display problem on our side."
        action={
          <Button variant="secondary" size="sm" onClick={reset}>
            Try again
          </Button>
        }
      />
    </>
  );
}
