import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { buttonVariants } from "@repo/ui/button";
import { StatePanel } from "@/components/state-panel";
import { TABLE_SURFACE } from "@/components/responsive-table";

interface Props {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
}

/**
 * A record that is not there.
 *
 * Distinct from the error panel on purpose: nothing went wrong, so the user gets a way back
 * rather than a retry that would fail again.
 */
export function NotFoundPanel({ title, description, backHref, backLabel }: Props) {
  return (
    <div className={TABLE_SURFACE}>
      <StatePanel
        icon={<FileQuestion className="size-5" />}
        title={title}
        description={description}
      >
        <Link href={backHref} className={buttonVariants({ variant: "outline" })}>
          {backLabel}
        </Link>
      </StatePanel>
    </div>
  );
}
