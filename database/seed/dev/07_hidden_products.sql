-- One DRAFT and one ARCHIVED product, which the storefront must never show.
--
-- Every seeded product so far is PUBLISHED, so the single most important rule on the storefront —
-- that a draft never reaches a customer — cannot be checked by looking at it. With these two in
-- place, any regression in the published filter is visible immediately: the listing count moves,
-- or the detail page answers instead of 404ing.
--
-- They are also the fixtures for the "unknown or unpublished slug returns 404" check:
--   /products/prototype-split-keyboard  -> 404 (DRAFT)
--   /products/discontinued-webcam-c920  -> 404 (ARCHIVED)
--
-- Both carry a price and an image so that nothing is hidden by accident — if one ever appears on
-- the storefront it will look like a real product, which is precisely the failure worth catching.
--
-- Depends on 04_storefront.sql for the categories and brands.
--
-- Idempotent: ON CONFLICT DO NOTHING and NOT EXISTS. Nothing here drops or deletes.

INSERT INTO products (name, slug, description, price_cents, compare_at_price_cents, stock, status, category_id, brand_id)
SELECT
  v.name, v.slug, v.description, v.price_cents, NULL, v.stock, v.status::product_status,
  (SELECT id FROM categories WHERE slug = v.category_slug),
  (SELECT id FROM brands     WHERE slug = v.brand_slug)
FROM (VALUES
  ('Prototype Split Keyboard', 'prototype-split-keyboard', 'Unreleased. Must never appear on the storefront.', 24900, 10, 'DRAFT',    'peripherals', 'keychron'),
  ('Discontinued Webcam C920', 'discontinued-webcam-c920', 'No longer sold. Must never appear on the storefront.', 7900, 0, 'ARCHIVED', 'accessories', 'logitech')
) AS v(name, slug, description, price_cents, stock, status, category_slug, brand_slug)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_images (product_id, url, alt, position)
SELECT p.id, v.url, v.alt, 0
FROM (VALUES
  ('prototype-split-keyboard', 'https://picsum.photos/seed/prototype/800/800', 'A split ergonomic keyboard'),
  ('discontinued-webcam-c920', 'https://picsum.photos/seed/webcam/800/800',    'A clip-on desktop webcam')
) AS v(product_slug, url, alt)
JOIN products p ON p.slug = v.product_slug
WHERE NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id);
