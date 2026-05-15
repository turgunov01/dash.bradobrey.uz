-- Merchant-scoped service categories for marketplace services.
-- Run in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS marketplace_service_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  marketplace_barbershop_id uuid NOT NULL REFERENCES marketplace_barbershops(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_marketplace_service_categories_barbershop_name
  ON marketplace_service_categories (marketplace_barbershop_id, name);

CREATE INDEX IF NOT EXISTS idx_marketplace_service_categories_barbershop_active
  ON marketplace_service_categories (marketplace_barbershop_id, is_active, name);

