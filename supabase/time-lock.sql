-- =========================================================================
-- TIME-BASED PICK LOCK
-- Locks pick edits 5 minutes before each match's kickoff_utc.
-- Enforced at the DATABASE level (RLS), so even if someone bypasses the UI
-- they can't sneak picks in past the deadline.
--
-- Run once in Supabase SQL Editor.
-- =========================================================================

-- =========================================================================
-- Helper: returns TRUE if the fixture's kickoff is more than 5 minutes away
-- (i.e. still open for picks). SECURITY DEFINER so it can read fixtures
-- regardless of caller's RLS context.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.fixture_open_for_picks(p_fixture_id bigint)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT kickoff_utc > now() + interval '5 minutes'
       FROM public.fixtures
       WHERE id = p_fixture_id),
    false
  );
$$;

-- =========================================================================
-- Replace pick INSERT policy: must own + fixture still open
-- =========================================================================
DROP POLICY IF EXISTS "users insert own picks" ON public.picks;
CREATE POLICY "users insert own picks"
  ON public.picks FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.fixture_open_for_picks(fixture_id)
  );

-- =========================================================================
-- Replace pick UPDATE policy: must own + not flagged locked + fixture open
-- =========================================================================
DROP POLICY IF EXISTS "users update own unlocked picks" ON public.picks;
CREATE POLICY "users update own unlocked picks"
  ON public.picks FOR UPDATE
  USING (
    user_id = auth.uid()
    AND locked = false
    AND public.fixture_open_for_picks(fixture_id)
  );

-- =========================================================================
-- Replace pick DELETE policy: same constraints as update
-- =========================================================================
DROP POLICY IF EXISTS "users delete own unlocked picks" ON public.picks;
CREATE POLICY "users delete own unlocked picks"
  ON public.picks FOR DELETE
  USING (
    user_id = auth.uid()
    AND public.fixture_open_for_picks(fixture_id)
  );

-- Verification
SELECT policyname FROM pg_policies
WHERE schemaname='public' AND tablename='picks'
ORDER BY policyname;
