-- =========================================================================
-- HELPER FUNCTION: is_pool_member
-- Required by chat RLS policies and pool visibility policies
-- This function checks if a user is a member of a pool.
--
-- Run this in Supabase SQL Editor.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.is_pool_member(p_pool_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pool_members
    WHERE pool_id = p_pool_id AND user_id = p_user_id
  );
$$;

-- Verify it exists
SELECT proname FROM pg_proc WHERE proname = 'is_pool_member';
