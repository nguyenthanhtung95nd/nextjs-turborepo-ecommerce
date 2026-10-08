-- Sample catalogue for working on the storefront.
--
-- Local convenience only. Without it the home page has one product and no images, so the grid,
-- the sale badge, the out-of-stock state and anything LCP-related cannot be judged.
--
-- Images come from picsum.photos (stable, seeded URLs over https) rather than a real CDN — the
-- point is to exercise next/image, not to ship artwork.
--
-- Idempotent: every statement is ON CONFLICT DO NOTHING, so re-running changes nothing.

INSERT INTO categories (name, slug) VALUES
  ('Peripherals', 'peripherals'),
  ('Displays',    'displays'),
  ('Audio',       'audio'),
  ('Accessories', 'accessories')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO brands (name, slug) VALUES
  ('Corsair',        'corsair'),
  ('Logitech',       'logitech'),
  ('Dell',           'dell'),
  ('Anker',          'anker'),
  ('Audio-Technica', 'audio-technica'),
  ('LG',             'lg')
ON CONFLICT (slug) DO NOTHING;

-- price_cents and compare_at_price_cents are integer cents. The DB CHECK requires
-- compare_at > price, so only genuine markdowns carry one.
INSERT INTO products (name, slug, description, price_cents, compare_at_price_cents, stock, status, category_id, brand_id)
SELECT
  v.name, v.slug, v.description, v.price_cents, v.compare_at, v.stock, 'PUBLISHED',
  (SELECT id FROM categories WHERE slug = v.category_slug),
  (SELECT id FROM brands     WHERE slug = v.brand_slug)
FROM (VALUES
  ('Mechanical Keyboard K70', 'mechanical-keyboard-k70', 'Cherry MX Red switches, full-size layout, detachable wrist rest.', 15900, 18900, 42, 'peripherals', 'corsair'),
  ('4K Monitor U2723QE',      '4k-monitor-u2723qe',      '27-inch IPS Black panel, USB-C hub built in, 90W power delivery.', 64900, NULL,  7,  'displays',    'dell'),
  ('USB-C Hub 7-in-1',        'usb-c-hub-7-in-1',        'HDMI, Ethernet, SD, microSD and three USB-A ports from one cable.', 4999, 5999, 230, 'accessories', 'anker'),
  ('Studio Headphones M50x',  'studio-headphones-m50x',  'Closed-back monitors with a flat response and swivelling cups.',   14900, NULL, 18, 'audio',       'audio-technica'),
  ('Wireless Mouse MX3',      'wireless-mouse-mx3',      'MagSpeed wheel, 70-day battery, pairs with three devices.',        9900,  NULL, 64, 'peripherals', 'logitech'),
  ('Desk Mat XL',             'desk-mat-xl',             'Stitched edges, 900x400mm, non-slip base.',                        3450,  NULL, 112,'accessories', NULL),
  ('Ultrawide 34in Curved',   'ultrawide-34in-curved',   '3440x1440 at 160Hz, 1000R curve, single-cable USB-C.',             89900, 99900, 0, 'displays',    'lg'),
  ('Keyboard Wrist Rest',     'keyboard-wrist-rest',     'Memory foam with a washable cover.',                               2450,  NULL, 95, 'accessories', NULL)
) AS v(name, slug, description, price_cents, compare_at, stock, category_slug, brand_slug)
ON CONFLICT (slug) DO NOTHING;

-- One image each. `position` 0 makes it the card thumbnail and the hero.
INSERT INTO product_images (product_id, url, alt, position)
SELECT p.id, v.url, v.alt, 0
FROM (VALUES
  ('mechanical-keyboard-k70', 'https://picsum.photos/seed/keyboard/800/800',  'Mechanical keyboard seen from above'),
  ('4k-monitor-u2723qe',      'https://picsum.photos/seed/monitor/800/800',   'A 27-inch monitor on a desk'),
  ('usb-c-hub-7-in-1',        'https://picsum.photos/seed/hub/800/800',       'A compact USB-C hub with its cable'),
  ('studio-headphones-m50x',  'https://picsum.photos/seed/headphones/800/800','Over-ear studio headphones'),
  ('wireless-mouse-mx3',      'https://picsum.photos/seed/mouse/800/800',     'A wireless mouse at an angle'),
  ('desk-mat-xl',             'https://picsum.photos/seed/deskmat/800/800',   'A large desk mat laid flat'),
  ('ultrawide-34in-curved',   'https://picsum.photos/seed/ultrawide/800/800', 'An ultrawide curved monitor'),
  ('keyboard-wrist-rest',     'https://picsum.photos/seed/wristrest/800/800', 'A padded keyboard wrist rest')
) AS v(product_slug, url, alt)
JOIN products p ON p.slug = v.product_slug
WHERE NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id);
