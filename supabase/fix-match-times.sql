-- Fix: Correct all World Cup 2026 fixture times (subtract 2 hours)
-- These matches have times 2 hours ahead of actual UTC

UPDATE public.fixtures
SET kickoff_utc = kickoff_utc - INTERVAL '2 hours'
WHERE season = 2026 AND league_id = 1;

-- Verify the correction
SELECT
  id,
  home_team,
  away_team,
  kickoff_utc,
  EXTRACT(HOUR FROM kickoff_utc AT TIME ZONE 'America/Mexico_City') AS hour_mx
FROM public.fixtures
WHERE season = 2026
ORDER BY kickoff_utc
LIMIT 5;
