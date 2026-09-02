CREATE TYPE product_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE products (
  id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name                   TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 160),
  slug                   TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description            TEXT,
  price_cents            INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  compare_at_price_cents INTEGER CHECK (compare_at_price_cents >= 0),
  stock                  INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  status                 product_status NOT NULL DEFAULT 'DRAFT',
  category_id            BIGINT REFERENCES categories (id) ON DELETE RESTRICT,
  brand_id               BIGINT REFERENCES brands (id) ON DELETE RESTRICT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT products_compare_at_gt_price
    CHECK (compare_at_price_cents IS NULL OR compare_at_price_cents > price_cents)
);

CREATE INDEX idx_products_status      ON products (status);
CREATE INDEX idx_products_category_id ON products (category_id);
CREATE INDEX idx_products_brand_id    ON products (brand_id);
CREATE INDEX idx_products_price_cents ON products (price_cents);
CREATE INDEX idx_products_name        ON products (name);
CREATE INDEX idx_products_created_at  ON products (created_at);
