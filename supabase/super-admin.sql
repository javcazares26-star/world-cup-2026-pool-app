-- =========================================================================
-- PLATFORM ADMIN LOCKDOWN
-- Makes pool creation + deletion an admin-only action.
-- Non-admin users can still join pools, predict, chat, leaderboard — they
-- just can't create or delete pools.
--
-- Run this in Supabase SQL Editor in TWO STEPS:
--   1. Run section A to create the table + helpers
--   2. Look at section B output, copy your user_id, paste it into the INSERT
--      in section C, then run section C to claim admin
--   3. Run section D to update the RPCs + policies
-- =========================================================================

-- =========================================================================
-- SECTION A — table + helper function
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.super_admins (
  user_id  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now()
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read super_admins" ON public.super_admins;
CREATE POLICY "anyone can read super_admins"
  ON public.super_admins FOR SELECT
  USING (true);

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid());
$$;

-- =========================================================================
-- SECTION B — list all users so you can find your own user_id
-- Run this, find the row with YOUR email/name, copy the id.
-- =========================================================================

SELECT
  id,
  email,
  raw_user_meta_data->>'full_name' AS google_name,
  created_at
FROM auth.users
ORDER BY created_at;

-- =========================================================================
-- SECTION C — claim admin for yourself
-- Replace the UUID placeholder below with YOUR id from section B output.
-- =========================================================================

-- INSERT INTO public.super_admins (user_id)
-- VALUES ('PASTE-YOUR-UUID-HERE')
-- ON CONFLICT DO NOTHING;

-- Verify:
-- SELECT u.email, sa.added_at FROM public.super_admins sa
--   JOIN auth.users u ON u.id = sa.user_id;

-- =========================================================================
-- SECTION D — restrict create/delete to admins only
-- =========================================================================

-- create_pool now requires super admin
CREATE OR REPLACE FUNCTION public.create_pool(p_name text, p_code text default null)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_pool_id uuid;
  v_code    text;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only the platform admin can create pools' USING ERRCODE = 'P0005';
  END IF;
  v_code := COALESCE(
    UPPER(p_code),
    UPPER(SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 6))
  );
  INSERT INTO public.pools (code, name, owner_id)
    VALUES (v_code, p_name, auth.uid())
    RETURNING id INTO v_pool_id;
  INSERT INTO public.pool_members (pool_id, user_id, role)
    VALUES (v_pool_id, auth.uid(), 'owner');
  RETURN v_pool_id;
END;
$$;

-- delete_pool now allows super admin (in addition to the pool owner — which
-- in practice is also the super admin, since only admin can create)
CREATE OR REPLACE FUNCTION public.delete_pool(p_pool_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT owner_id INTO v_owner FROM public.pools WHERE id = p_pool_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Pool not found' USING ERRCODE = 'P0001';
  END IF;
  IF NOT public.is_super_admin() AND v_owner != auth.uid() THEN
    RAISE EXCEPTION 'Only the platform admin or pool owner can delete this pool'
      USING ERRCODE = 'P0002';
  END IF;
  DELETE FROM public.pools WHERE id = p_pool_id;
END;
$$;

-- Block direct INSERT on pools table for non-admins (covers any path that
-- bypasses the RPC — e.g., someone trying to use the REST API directly)
DROP POLICY IF EXISTS "authenticated can create pools" ON public.pools;
DROP POLICY IF EXISTS "super admin creates pools"     ON public.pools;
CREATE POLICY "super admin creates pools"
  ON public.pools FOR INSERT
  WITH CHECK (public.is_super_admin() AND owner_id = auth.uid());

-- Let super admin see ALL pools (regardless of membership)
DROP POLICY IF EXISTS "pool visibility" ON public.pools;
CREATE POLICY "pool visibility"
  ON public.pools FOR SELECT
  USING (
    is_public
    OR owner_id = auth.uid()
    OR public.is_pool_member(id, auth.uid())
    OR public.is_super_admin()
  );

-- Verification — these should all exist
SELECT proname FROM pg_proc
WHERE proname IN ('is_super_admin','create_pool','delete_pool')
ORDER BY proname;
