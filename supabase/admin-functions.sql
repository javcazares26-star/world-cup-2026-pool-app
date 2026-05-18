-- =========================================================================
-- ADMIN FUNCTIONS — owner-only pool management
-- Adds two RPCs and the necessary RLS update:
--   * delete_pool(pool_id)              — owner deletes their own pool
--   * remove_pool_member(pool_id, uid)  — owner kicks a member
--   * add_pool_member(pool_id, email)   — owner invites by email (best-effort)
--
-- Plus an RLS policy so owners can see all pool_members in their pool
-- (not just themselves) — needed for the Admin tab to list everyone.
--
-- Run once in Supabase SQL Editor.
-- =========================================================================

-- =========================================================================
-- 1. DELETE POOL — only the owner can run this
-- =========================================================================
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
  IF v_owner != auth.uid() THEN
    RAISE EXCEPTION 'Only the owner can delete this pool' USING ERRCODE = 'P0002';
  END IF;
  -- Cascading deletes (configured on the FK constraints) handle pool_members,
  -- picks, and messages tied to this pool.
  DELETE FROM public.pools WHERE id = p_pool_id;
END;
$$;

-- =========================================================================
-- 2. REMOVE POOL MEMBER — kick someone (delete their picks/messages too)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.remove_pool_member(p_pool_id uuid, p_user_id uuid)
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
  IF v_owner != auth.uid() THEN
    RAISE EXCEPTION 'Only the owner can remove members' USING ERRCODE = 'P0002';
  END IF;
  IF p_user_id = v_owner THEN
    RAISE EXCEPTION 'Cannot remove the pool owner' USING ERRCODE = 'P0003';
  END IF;
  -- Wipe their footprint in this pool
  DELETE FROM public.picks       WHERE pool_id = p_pool_id AND user_id = p_user_id;
  DELETE FROM public.messages    WHERE pool_id = p_pool_id AND user_id = p_user_id;
  DELETE FROM public.pool_members WHERE pool_id = p_pool_id AND user_id = p_user_id;
END;
$$;

-- =========================================================================
-- 3. ADD POOL MEMBER BY EMAIL — invite by lookup
-- Best-effort: matches an existing profile by display_name or auth email.
-- Returns the user_id added, or NULL if no matching profile found.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.add_pool_member_by_email(p_pool_id uuid, p_email text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_owner uuid;
  v_target_user uuid;
BEGIN
  SELECT owner_id INTO v_owner FROM public.pools WHERE id = p_pool_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Pool not found' USING ERRCODE = 'P0001';
  END IF;
  IF v_owner != auth.uid() THEN
    RAISE EXCEPTION 'Only the owner can invite members' USING ERRCODE = 'P0002';
  END IF;
  -- Look up the user by their auth email
  SELECT id INTO v_target_user
    FROM auth.users
    WHERE lower(email) = lower(p_email)
    LIMIT 1;
  IF v_target_user IS NULL THEN
    RAISE EXCEPTION 'No user found with that email. Ask them to sign in once first, then try again.'
      USING ERRCODE = 'P0004';
  END IF;
  INSERT INTO public.pool_members (pool_id, user_id, role)
    VALUES (p_pool_id, v_target_user, 'member')
    ON CONFLICT DO NOTHING;
  RETURN v_target_user;
END;
$$;

-- =========================================================================
-- 4. RLS — let owners see all members in their pool
-- (Existing policies only let users see themselves; owner needs to see everyone)
-- =========================================================================
DROP POLICY IF EXISTS "owner sees all members" ON public.pool_members;
CREATE POLICY "owner sees all members"
  ON public.pool_members FOR SELECT
  USING (
    pool_id IN (SELECT id FROM public.pools WHERE owner_id = auth.uid())
  );

-- Quick verification — these three should exist
SELECT proname AS function_name
FROM pg_proc
WHERE proname IN ('delete_pool', 'remove_pool_member', 'add_pool_member_by_email')
ORDER BY proname;
