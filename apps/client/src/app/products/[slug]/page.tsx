import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb, type Crumb } from "@/components/product-detail/breadcrumb";
import { ProductFacts } from "@/components/product-detail/product-facts";
import { ProductGallery } from "@/components/product-detail/product-gallery";
import { ProductPrice } from "@/components/product-detail/product-price";
import { StockBadge } from "@/components/product-detail/stock-badge";
import { getProductBySlug, listPublishedSlugs } from "@/lib/catalog/queries";

/**
 * Rebuild a product page at most once a minute.
 *
 * The same window as the home page, and for the same reason: these pages are prerendered, so
 * without it a price change in the admin would never reach a shopper until the next deploy. A
 * price is exactly the fact that must not be stale.
 */
export const revalidate = 60;

/**
 * Prerender every published product at build time.
 *
 * `dynamicParams` stays on (the default), so a product published after the build still renders on
 * first request and is cached from then on — this only decides which pages are ready in advance.
 */
/*
 * There is deliberately no `loading.tsx` for this route.
 *
 * A `loading.tsx` is a Suspense boundary, and once a response starts streaming its status code is
 * already sent — so `notFound()` below could only ever produce a soft 404: a 200 carrying
 * not-found UI. Next marks that HTML `noindex`, so search engines are safe either way, but a 200
 * also hides every broken link from logs and analytics.
 *
 * The skeleton costs almost nothing to give up here, because these pages are prerendered: a real
 * product is already built, and a stale one is served while it revalidates. The fallback would
 * show only on the first request for a product published since the last build.
 *
 * The listing at `/products` keeps its `loading.tsx` — it is genuinely dynamic, re-renders on
 * every filter change, and has no 404 to report.
 */
export async function generateStaticParams() {
  const slugs = await listPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

const MAX_DESCRIPTION_LENGTH = 160;

/**
 * SEO metadata for the product.
 *
 * Shares `getProductBySlug` with the page component, which is wrapped in React's `cache`, so the
 * two run one query between them rather than two.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  // Next renders `not-found.tsx` for this route anyway; returning a title keeps the browser tab
  // from falling back to the template on a 404.
  if (!product) return { title: "Product not found" };

  const description = product.description?.slice(0, MAX_DESCRIPTION_LENGTH) ?? product.name;
  const image = product.images[0];

  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      images: image ? [{ url: image.url, alt: image.alt }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  // A draft, archived or non-existent product is one and the same to a shopper. `getProductBySlug`
  // already filters by status, so there is no path here that could reveal an unreleased product.
  if (!product) notFound();

  const trail: Crumb[] = [{ label: "Shop", href: "/products" }];
  if (product.category) {
    trail.push({
      label: product.category.name,
      href: `/products?category=${product.category.slug}`,
    });
  }

  return (
    <article className="pb-12">
      <Breadcrumb trail={trail} current={product.name} />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} name={product.name} />

        <div className="flex flex-col gap-6">
          <div>
            {product.brand && (
              <p className="text-sm font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                {product.brand.name}
              </p>
            )}
            <h1 className="mt-1 text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-tight tracking-tight">
              {product.name}
            </h1>
          </div>

          <ProductPrice
            priceCents={product.priceCents}
            compareAtPriceCents={product.compareAtPriceCents}
          />

          <StockBadge stock={product.stock} />

          {/*
            Checkout is Phase 14. A button that looks live but does nothing is worse than none at
            all, so the page says plainly where it stands rather than pretending.
          */}
          <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            Online ordering isn’t open yet. Get in touch to reserve this item.
          </p>

          {product.description && (
            <section aria-label="Description">
              <h2 className="mb-2 text-lg font-bold">Description</h2>
              {/*
                Rendered as text, never as HTML. The description is admin-authored, but
                `dangerouslySetInnerHTML` here would turn any future import path — a supplier
                feed, a CSV — into stored XSS on a public page.
              */}
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </section>
          )}

          <section aria-label="Product details">
            <h2 className="mb-3 text-lg font-bold">Details</h2>
            <ProductFacts product={product} />
          </section>
        </div>
      </div>
    </article>
  );
}
