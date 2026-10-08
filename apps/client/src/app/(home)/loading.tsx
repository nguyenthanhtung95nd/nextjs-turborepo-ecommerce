import { SkeletonBar, SkeletonGrid } from "@/components/skeleton-bar";

const SKELETON_CARDS = 8;
const SKELETON_TILES = 4;

/**
 * Keeps the home page's shape while the catalogue query runs.
 *
 * It lives in the `(home)` route group, not at the root of `app/`, and that matters twice over.
 * A root `loading.tsx` applies to *every* route, so this hero-and-tiles skeleton used to flash on
 * pages shaped nothing like it — and, less visibly, its Suspense boundary made every response in
 * the app a streamed one, which meant `notFound()` could never set a 404 status anywhere. The
 * route group scopes both effects to the page this skeleton is actually drawn for.
 */
export default function HomeLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading products…</span>

      <section className="grid items-center gap-6 py-10 md:grid-cols-2 md:gap-12 md:py-16">
        <div className="grid gap-4">
          <SkeletonBar className="h-3 w-28" />
          <SkeletonBar className="h-14" />
          <SkeletonBar className="h-4 w-3/4" />
          <SkeletonBar className="h-11 w-48" />
        </div>
        <SkeletonBar className="aspect-[4/3] rounded-2xl" />
      </section>

      <section className="py-6 md:py-10">
        <SkeletonBar className="mb-5 h-7 w-52" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: SKELETON_TILES }, (_, index) => (
            <SkeletonBar key={index} className="h-[58px] rounded-xl" />
          ))}
        </div>
      </section>

      <section className="py-6 md:py-10">
        <SkeletonBar className="mb-5 h-7 w-28" />
        <SkeletonGrid count={SKELETON_CARDS} />
      </section>
    </div>
  );
}
