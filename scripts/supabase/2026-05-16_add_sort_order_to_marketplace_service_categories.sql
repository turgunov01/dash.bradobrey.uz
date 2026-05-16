-- Ordering for merchant service categories.
-- Run in Supabase SQL editor after creating marketplace_service_categories.

ALTER TABLE marketplace_service_categories
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY marketplace_barbershop_id
      ORDER BY name ASC NULLS LAST, created_at ASC NULLS LAST
    ) AS next_sort_order
  FROM marketplace_service_categories
)
UPDATE marketplace_service_categories AS categories
SET sort_order = ranked.next_sort_order
FROM ranked
WHERE categories.id = ranked.id
  AND COALESCE(categories.sort_order, 0) = 0;

CREATE INDEX IF NOT EXISTS idx_marketplace_service_categories_barbershop_order
  ON marketplace_service_categories (marketplace_barbershop_id, sort_order, name);
