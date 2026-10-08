import { SkeletonBar, SkeletonGrid } from "@/components/skeleton-bar";

import { CATALOG_PAGE_SIZE } from "@repo/contracts";

const SKELETON_FILTER_GROUPS = 4;

/**
 * Holds the listing's shape while the filtered query runs.
 *
 * A full page of card skeletons, not a spinner: this page is reached again on every filter and
 * page change, and a layout that collapses to a spinner and back jumps the scroll position each
 * time.
 */
export default function ProductsLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="py-6 md:py-10">
      <span className="sr-only">Loading products…</span>

      <SkeletonBar className="h-9 w-64" />
      <div className="mt-4 flex items-center gap-3">
        <SkeletonBar className="h-5 w-28" />
        <SkeletonBar className="ml-auto h-10 w-40" />
      </div>

      <div className="mt-6 gap-10 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="hidden lg:flex lg:flex-col lg:gap-6">
          {Array.from({ length: SKELETON_FILTER_GROUPS }, (_, index) => (
            <div key={index}>
              <SkeletonBar className="mb-2 h-3 w-20" />
              <SkeletonBar className="h-24" />
            </div>
          ))}
        </div>

        <SkeletonGrid count={CATALOG_PAGE_SIZE} />
      </div>
    </div>
  );
}
