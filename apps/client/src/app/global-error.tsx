"use client";

import { useEffect } from "react";

/**
 * The boundary of last resort.
 *
 * `error.tsx` renders *inside* the root layout, so it cannot catch a failure in the layout
 * itself — and the layout queries the database for the header's categories. If that query throws,
 * without this file a shopper gets Next's unstyled default error page.
 *
 * It replaces the whole document, which is why it carries its own `<html>` and `<body>` and why
 * the styling is inline: the layout that would have loaded the stylesheet is the thing that
 * failed. Colours are the storefront's own tokens, written out literally for the same reason.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[storefront] root layout failed", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "1.5rem",
          background: "#fbfdfd",
          color: "#0f172a",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div style={{ maxWidth: "26rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>Something went wrong</h1>
          {/* The message and stack stay in the server log; this page says nothing about them. */}
          <p style={{ margin: "0 0 1.5rem", color: "#64748b" }}>
            The shop is having a problem. Please try again in a moment.
          </p>
          <button
            onClick={reset}
            style={{
              height: "2.75rem",
              padding: "0 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#0f766e",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
