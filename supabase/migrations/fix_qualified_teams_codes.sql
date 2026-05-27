-- ============================================================================
-- Fix qualified team codes (May 23, 2026)
-- ============================================================================
-- Converts complex 3rd place bracket codes like "3-ABCDF" into simple group
-- indicators like "3A" (3rd place from Group A) by taking the first available group.

-- Update qualified_team_away (and home if needed)
UPDATE public.fixtures
SET qualified_team_away =
  CASE
    WHEN qualified_team_away LIKE '3-%' THEN
      '3' || SUBSTRING(qualified_team_away, 3, 1)
    ELSE qualified_team_away
  END
WHERE is_knockout = true
  AND qualified_team_away LIKE '3-%';

UPDATE public.fixtures
SET qualified_team_home =
  CASE
    WHEN qualified_team_home LIKE '3-%' THEN
      '3' || SUBSTRING(qualified_team_home, 3, 1)
    ELSE qualified_team_home
  END
WHERE is_knockout = true
  AND qualified_team_home LIKE '3-%';

-- Verification
-- SELECT qualified_team_home, qualified_team_away, round
-- FROM public.fixtures
-- WHERE is_knockout = true
-- ORDER BY kickoff_utc
-- LIMIT 20;
