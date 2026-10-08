-- Fills in facts missing from products that pre-date the storefront seeds.
--
-- 04_storefront.sql inserts with ON CONFLICT (slug) DO NOTHING, so any product that already
-- existed under one of those slugs kept whatever it had — which for `mechanical-keyboard-k70`
-- was no category, no brand and no description. The detail page rendered correctly and showed
-- almost nothing, because there was almost nothing to show.
--
-- Deliberately narrow and additive:
--   * every assignment is guarded by `IS NULL`, so a value already in the table is never replaced;
--   * the WHERE clause names the slug, so no other product is touched;
--   * no DROP, no DELETE, nothing destructive.
--
-- Running it twice changes nothing the second time: after the first run the columns are no longer
-- NULL, so COALESCE keeps what is there and the WHERE clause matches no rows.

UPDATE products p
SET
  category_id = COALESCE(p.category_id, (SELECT id FROM categories WHERE slug = 'peripherals')),
  brand_id    = COALESCE(p.brand_id,    (SELECT id FROM brands     WHERE slug = 'corsair')),
  description = COALESCE(
    p.description,
    'Cherry MX Red switches, full-size layout, detachable wrist rest.'
  )
WHERE p.slug = 'mechanical-keyboard-k70'
  AND (p.category_id IS NULL OR p.brand_id IS NULL OR p.description IS NULL);
