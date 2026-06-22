-- Branch-scoped service categories for the admin dashboard.
-- Run in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS service_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_service_categories_branch_name
  ON service_categories (branch_id, name);

CREATE INDEX IF NOT EXISTS idx_service_categories_branch_order
  ON service_categories (branch_id, sort_order, name);

CREATE INDEX IF NOT EXISTS idx_service_categories_branch_active
  ON service_categories (branch_id, is_active, sort_order, name);
