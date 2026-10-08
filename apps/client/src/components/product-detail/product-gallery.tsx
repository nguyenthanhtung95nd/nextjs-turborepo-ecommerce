"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import type { ProductImage } from "@/lib/catalog/queries";

/** The main image is the page's LCP element, so it is sized for the largest slot it can occupy. */
const MAIN_SIZES = "(min-width: 1024px) 50vw, 100vw";
const THUMB_SIZES = "88px";

/**
 * The product's images, with a thumbnail strip when there is more than one.
 *
 * The only client island on the detail page — picking an image is genuinely interactive. It still
 * renders on the server first, so the main image is in the initial HTML and can be the LCP
 * element; `priority` preloads it rather than lazy-loading it.
 *
 * Thumbnails are real `<button>`s, not divs with click handlers: they are reachable by Tab,
 * activate on Space and Enter, and announce their pressed state without extra work.
 */
export function ProductGallery({
  images,
  name,
}: {
  images: readonly ProductImage[];
  name: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  if (!active) {
    return (
      <div className="grid aspect-square place-items-center rounded-2xl border border-border bg-muted text-muted-foreground">
        <ImageOff className="size-10" aria-hidden="true" />
        <span className="sr-only">No photo of {name} is available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
        <Image
          src={active.url}
          alt={active.alt}
          fill
          priority
          sizes={MAIN_SIZES}
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <ul className="flex flex-wrap gap-2.5" aria-label={`More photos of ${name}`}>
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-pressed={index === activeIndex}
                // The accessible name has to say which photo this is. The thumbnail's own alt is
                // empty because the button is already labelled, and announcing both would read
                // the description twice.
                aria-label={`Show photo ${index + 1} of ${images.length}: ${image.alt}`}
                className={`relative block size-[88px] overflow-hidden rounded-xl border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  index === activeIndex ? "border-primary" : "border-border hover:border-primary/50"
                }`}
              >
                <Image src={image.url} alt="" fill sizes={THUMB_SIZES} className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
