-- Merchant-scoped marketplace entities (barbers + services).
-- Run in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS marketplace_barbers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  marketplace_barbershop_id uuid NOT NULL REFERENCES marketplace_barbershops(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text,
  specialization text,
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_barbers_barbershop_active
  ON marketplace_barbers (marketplace_barbershop_id, is_active, name);

CREATE INDEX IF NOT EXISTS idx_marketplace_barbers_branch
  ON marketplace_barbers (branch_id);

CREATE TABLE IF NOT EXISTS marketplace_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  marketplace_barbershop_id uuid NOT NULL REFERENCES marketplace_barbershops(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(12,2),
  duration_minutes integer,
  category_name text,
  image text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_services_barbershop_active
  ON marketplace_services (marketplace_barbershop_id, is_active, name);
