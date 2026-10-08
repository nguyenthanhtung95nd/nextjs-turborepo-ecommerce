import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { listCategoryEntries } from "@/lib/catalog/queries";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_NAME = "volt.";
const DESCRIPTION = "A small range of keyboards, displays and audio for your desk.";

export const metadata: Metadata = {
  // Without this every `alternates.canonical` stays a bare path, which is not a canonical URL at
  // all, and OpenGraph image URLs go out relative — which no crawler will resolve.
  metadataBase: new URL(SITE_URL),
  title: { default: "volt. — desk gear", template: "%s · volt." },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "volt. — desk gear",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
};

/**
 * The shell every storefront page sits in.
 *
 * The categories are fetched once here rather than per page: the header and footer both list
 * them, and a layout does not re-render on navigation, so this is one query per visit, not one
 * per page view.
 *
 * Deliberately *not* read here: the session. One `auth()` call in a layout makes every route
 * below it dynamic, which would cost the home page and all eighteen product pages their static
 * rendering — a high price for a "signed in as…" label. The account link handles it instead by
 * redirecting anonymous visitors.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const categories = await listCategoryEntries();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/*
          The first thing in the tab order, visible only once focused. Without it a keyboard user
          tabs through the whole header — logo, five nav links, search, three icons — on every
          single page before reaching the content.
        */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-semibold focus:text-primary-foreground"
        >
          Skip to content
        </a>

        <SiteHeader categories={categories} />
        <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-4 md:px-6">
          {children}
        </main>
        <SiteFooter categories={categories} />
      </body>
    </html>
  );
}
