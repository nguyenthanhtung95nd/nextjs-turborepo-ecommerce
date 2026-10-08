import { SkeletonBar, SkeletonGrid } from "@/components/skeleton-bar";
import { CATALOG_PAGE_SIZE } from "@repo/contracts";

const SKELETON_FILTER_GROUPS = 4;

/**
 * Holds the search page's shape while the query runs.
 *
 * Unlike the category and brand pages, this route has no 404 to report — an unmatched term is an
 * empty result, not a missing page — so a Suspense boundary costs nothing here.
 */
export default function SearchLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="py-6 md:py-10">
      <span className="sr-only">Searching…</span>

      <SkeletonBar className="h-9 w-72" />
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
