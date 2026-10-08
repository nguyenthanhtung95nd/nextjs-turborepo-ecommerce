-- Extends the storefront sample catalogue past one page.
--
-- 04_storefront.sql seeds 8 products, which is under the listing's page size of 12 — so filters,
-- sorting and pagination cannot actually be judged against it: there is never a second page, and
-- any filter that removes a few items still fits on one screen. This brings the catalogue to 18,
-- spread across every category and a wider price range.
--
-- Depends on 04_storefront.sql for the shared categories and brands.
--
-- Idempotent: every statement is ON CONFLICT DO NOTHING or guarded by NOT EXISTS, so re-running
-- it changes nothing. Nothing here drops or deletes.

INSERT INTO brands (name, slug) VALUES
  ('Keychron', 'keychron'),
  ('Sony',     'sony'),
  ('Elgato',   'elgato'),
  ('Samsung',  'samsung')
ON CONFLICT (slug) DO NOTHING;

-- A deliberate spread: prices from $12 to $1,299 so a price range excludes something at either
-- end, two products out of stock so the in-stock filter changes the result, and markdowns on only
-- some so the Sale badge stays meaningful.
INSERT INTO products (name, slug, description, price_cents, compare_at_price_cents, stock, status, category_id, brand_id)
SELECT
  v.name, v.slug, v.description, v.price_cents, v.compare_at, v.stock, 'PUBLISHED',
  (SELECT id FROM categories WHERE slug = v.category_slug),
  (SELECT id FROM brands     WHERE slug = v.brand_slug)
FROM (VALUES
  ('Keychron K8 Pro',        'keychron-k8-pro',        'Hot-swappable 75% board, QMK/VIA, wireless or wired.',              9900,  11900, 31, 'peripherals', 'keychron'),
  ('WH-1000XM5 Headphones',  'wh-1000xm5-headphones',  'Adaptive noise cancelling with 30-hour battery life.',              39900, NULL,  12, 'audio',       'sony'),
  ('Stream Deck MK.2',       'stream-deck-mk2',        'Fifteen LCD keys for one-press actions and scene switching.',       14900, NULL,  0,  'accessories', 'elgato'),
  ('ViewFinity 5K Monitor',  'viewfinity-5k-monitor',  '27-inch 5K panel, Thunderbolt 4, matte finish.',                    129900,139900, 4,  'displays',    'samsung'),
  ('Desk Speakers A2+',      'desk-speakers-a2-plus',  'Powered bookshelf pair with a rear-facing bass port.',              31900, NULL,  23, 'audio',       'audio-technica'),
  ('Monitor Arm Single',     'monitor-arm-single',     'Gas-spring arm, clamps or grommets, up to 9kg.',                    8900,  NULL,  58, 'accessories', NULL),
  ('Cable Sleeve Kit',       'cable-sleeve-kit',       'Braided sleeving, clips and velcro ties for one desk.',             1200,  1900,  410,'accessories', NULL),
  ('Vertical Mouse Pro',     'vertical-mouse-pro',     '57-degree grip that keeps the forearm neutral.',                    7900,  NULL,  0,  'peripherals', 'logitech'),
  ('Portable Monitor 16in',  'portable-monitor-16in',  '1920x1200 IPS over a single USB-C cable, folding stand.',           22900, 25900, 16, 'displays',    'lg'),
  ('USB Microphone Wave',    'usb-microphone-wave',    'Cardioid condenser with a built-in pop filter and mute.',           15900, NULL,  27, 'audio',       'elgato')
) AS v(name, slug, description, price_cents, compare_at, stock, category_slug, brand_slug)
ON CONFLICT (slug) DO NOTHING;

-- One image each, position 0 so it is the card thumbnail.
INSERT INTO product_images (product_id, url, alt, position)
SELECT p.id, v.url, v.alt, 0
FROM (VALUES
  ('keychron-k8-pro',       'https://picsum.photos/seed/keychron/800/800',  'A compact mechanical keyboard'),
  ('wh-1000xm5-headphones', 'https://picsum.photos/seed/xm5/800/800',       'Over-ear wireless headphones'),
  ('stream-deck-mk2',       'https://picsum.photos/seed/streamdeck/800/800','A control pad with lit keys'),
  ('viewfinity-5k-monitor', 'https://picsum.photos/seed/viewfinity/800/800','A 27-inch monitor on a stand'),
  ('desk-speakers-a2-plus', 'https://picsum.photos/seed/speakers/800/800',  'A pair of bookshelf speakers'),
  ('monitor-arm-single',    'https://picsum.photos/seed/monitorarm/800/800','An articulated monitor arm'),
  ('cable-sleeve-kit',      'https://picsum.photos/seed/cables/800/800',    'Braided cable sleeving and clips'),
  ('vertical-mouse-pro',    'https://picsum.photos/seed/vertical/800/800',  'An upright vertical mouse'),
  ('portable-monitor-16in', 'https://picsum.photos/seed/portable/800/800',  'A slim portable monitor with a stand'),
  ('usb-microphone-wave',   'https://picsum.photos/seed/microphone/800/800','A desktop USB microphone')
) AS v(product_slug, url, alt)
JOIN products p ON p.slug = v.product_slug
WHERE NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id);
