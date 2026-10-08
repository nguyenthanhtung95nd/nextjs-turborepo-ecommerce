import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { buttonVariants } from "@repo/ui/button";
import { StatePanel } from "@/components/state-panel";
import { TABLE_SURFACE } from "@/components/responsive-table";

/**
 * Reached by `notFound()` from the detail pages — a product, user or role id that matches
 * nothing. Lives inside the `(app)` group so it keeps the sidebar and the account menu: being
 * dropped onto a bare page with no way back is the worse half of a 404.
 */
export default function AdminNotFound() {
  return (
    <div className={TABLE_SURFACE}>
      <StatePanel
        icon={<FileQuestion className="size-5" />}
        title="Not found"
        description="That record doesn't exist, or it was deleted while you were looking at it."
      >
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to the dashboard
        </Link>
      </StatePanel>
    </div>
  );
}
