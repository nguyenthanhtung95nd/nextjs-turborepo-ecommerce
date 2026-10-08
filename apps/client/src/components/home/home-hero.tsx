import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog/queries";

/**
 * The top of the home page.
 *
 * The image is the page's LCP element, so it is `priority` — Next preloads it instead of
 * lazy-loading, which is the difference between the hero appearing with the HTML and appearing
 * after a second round trip.
 */
export function HomeHero({ featured }: { featured: CatalogProduct | null }) {
  return (
    <section
      aria-label="Featured"
      className="grid items-center gap-6 py-10 md:grid-cols-2 md:gap-12 md:py-16"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
          New this week
        </p>
        <h1 className="mb-3.5 mt-2.5 text-[clamp(2rem,6vw,3.25rem)] font-extrabold leading-[1.1] tracking-tight">
          Gear that earns its desk space.
        </h1>
        <p className="mb-6 max-w-[46ch] text-[17px] text-muted-foreground">
          A small, opinionated range of keyboards, displays and audio. Everything in stock ships the
          same day.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/products"
            className="inline-flex h-11 items-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Shop all products
          </Link>
          {featured && (
            <Link
              href={`/products/${featured.slug}`}
              className="inline-flex h-11 items-center rounded-lg border border-border px-5 font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              See {featured.name}
            </Link>
          )}
        </div>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-accent">
        {featured?.imageUrl ? (
          <Image
            src={featured.imageUrl}
            alt={featured.imageAlt}
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="grid h-full place-items-center text-muted-foreground">
            <ImageOff className="size-10" aria-hidden="true" />
          </span>
        )}
      </div>
    </section>
  );
}
