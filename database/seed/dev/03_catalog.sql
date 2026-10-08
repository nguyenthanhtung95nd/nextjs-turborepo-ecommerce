-- Starter categories and brands so the product form's selectors have something to select.
-- Local convenience only; Phase 5 adds the real CRUD screens for both.
INSERT INTO categories (name, slug) VALUES
  ('Peripherals', 'peripherals'),
  ('Displays',    'displays'),
  ('Accessories', 'accessories'),
  ('Audio',       'audio')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO brands (name, slug) VALUES
  ('Corsair',  'corsair'),
  ('Logitech', 'logitech'),
  ('Dell',     'dell'),
  ('Anker',    'anker')
ON CONFLICT (slug) DO NOTHING;
