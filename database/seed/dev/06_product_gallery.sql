-- Extra photos, so the detail page's gallery has something to switch between.
--
-- Every product seeded so far has exactly one image, which means the thumbnail strip never
-- renders and the gallery cannot actually be judged — nor can its keyboard behaviour. This gives
-- four products a second, third and fourth photo and leaves the rest with one, so both shapes of
-- the page stay reachable.
--
-- Depends on 04_storefront.sql and 05_storefront_catalogue.sql for the products themselves.
--
-- Idempotent: guarded by NOT EXISTS on (product, position). Nothing here drops or deletes.

INSERT INTO product_images (product_id, url, alt, position)
SELECT p.id, v.url, v.alt, v.position
FROM (VALUES
  ('mechanical-keyboard-k70', 'https://picsum.photos/seed/keyboard-side/800/800',  'The keyboard seen from the side, showing the key height', 1),
  ('mechanical-keyboard-k70', 'https://picsum.photos/seed/keyboard-keys/800/800',  'Close-up of the keycaps and switches',                    2),
  ('mechanical-keyboard-k70', 'https://picsum.photos/seed/keyboard-desk/800/800',  'The keyboard in use on a desk',                           3),

  ('4k-monitor-u2723qe',      'https://picsum.photos/seed/monitor-back/800/800',   'The back of the monitor, showing its ports',              1),
  ('4k-monitor-u2723qe',      'https://picsum.photos/seed/monitor-stand/800/800',  'The monitor stand at full height',                        2),

  ('wh-1000xm5-headphones',   'https://picsum.photos/seed/xm5-folded/800/800',     'The headphones folded into their case',                   1),
  ('wh-1000xm5-headphones',   'https://picsum.photos/seed/xm5-worn/800/800',       'The headphones being worn',                               2),

  ('viewfinity-5k-monitor',   'https://picsum.photos/seed/viewfinity-angle/800/800','The monitor at a three-quarter angle',                   1),
  ('viewfinity-5k-monitor',   'https://picsum.photos/seed/viewfinity-ports/800/800','The Thunderbolt and USB ports along the rear edge',     2)
) AS v(product_slug, url, alt, position)
JOIN products p ON p.slug = v.product_slug
WHERE NOT EXISTS (
  SELECT 1 FROM product_images pi
  WHERE pi.product_id = p.id AND pi.position = v.position
);
