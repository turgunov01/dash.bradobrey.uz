-- Updates `users_role_check` to allow marketplace roles.
-- Run in Supabase SQL editor.
--
-- IMPORTANT:
-- 1) Before applying, check what roles exist in your DB:
--      select distinct role from users order by role;
-- 2) If you have roles not listed below, add them to the list,
--    otherwise the ADD CONSTRAINT will fail.

-- Optional: inspect current constraint definition
-- select conname, pg_get_constraintdef(oid) as definition
-- from pg_constraint
-- where conname = 'users_role_check';

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (
    role is null
    OR role IN (
      -- Employee roles
      'admin',
      'manager',
      'barber',
      'super-barber',
      'super-manager',

      -- Legacy dashboard roles (if used)
      'admin_network',
      'admin_branch',

      -- Existing client roles (if used)
      'owner',
      'member',

      -- Marketplace roles
      'merchant',
      'partner'
    )
  );
