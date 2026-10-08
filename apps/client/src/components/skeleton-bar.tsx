/**
 * One pulsing placeholder block.
 *
 * Shared by every `loading.tsx` so the skeletons across the storefront pulse at the same rate and
 * in the same colour — two implementations drifting apart is immediately visible when a shopper
 * navigates between pages.
 */
export function SkeletonBar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

/**
 * The card-shaped skeleton used wherever `ProductGrid` will appear.
 *
 * Mirrors the real card's aspect-square image box and two text lines, so nothing shifts when the
 * products arrive — that shift is the CLS the acceptance criteria asks about.
 */
export function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          <SkeletonBar className="aspect-square rounded-xl" />
          <SkeletonBar className="mt-2.5 h-4" />
          <SkeletonBar className="mt-1.5 h-3 w-3/5" />
        </div>
      ))}
    </div>
  );
}
