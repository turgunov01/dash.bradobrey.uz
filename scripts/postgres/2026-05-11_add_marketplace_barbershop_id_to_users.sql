-- Adds merchant scoping to Supabase `users`.
-- Run in Supabase SQL editor.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS marketplace_barbershop_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_marketplace_barbershop_id_fkey'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_marketplace_barbershop_id_fkey
      FOREIGN KEY (marketplace_barbershop_id)
      REFERENCES marketplace_barbershops(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_marketplace_barbershop_id
  ON users (marketplace_barbershop_id);

