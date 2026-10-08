import Link from "next/link";
import { Compass } from "lucide-react";
import { StatePanel } from "@/components/state-panel";

export default function NotFound() {
  return (
    <div className="py-10">
      <StatePanel
        icon={<Compass className="size-8" />}
        title="Page not found"
        description="That page doesn't exist, or the product behind it is no longer on sale."
      >
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-lg border border-border px-4 font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Back to the shop
        </Link>
      </StatePanel>
    </div>
  );
}
