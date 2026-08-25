import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shell/page-header";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";

export const metadata: Metadata = {
  title: "Upload problems",
};

export default function UploadPage() {
  return (
    <>
      <PageHeader
        title="Upload problems"
        description="Add a chapter from one of your textbooks. We classify each problem by topic, type, and difficulty so you can filter them later."
      />

      <EmptyState
        title="The upload flow is not built yet"
        body="This route exists so the flow is walkable. The dropzone, parsing preview, and classification review arrive with the dashboard."
        action={
          <Link href="/dashboard" className={buttonStyles("secondary")}>
            Back to dashboard
          </Link>
        }
        className="py-20"
      />
    </>
  );
}
