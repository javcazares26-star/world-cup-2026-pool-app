-- =========================================================================
-- FIX: Points Calculation for Leaderboard
-- =========================================================================

-- Step 1: Check what status values we actually have in fixtures
SELECT DISTINCT status, status_short, COUNT(*) as count
FROM public.fixtures
GROUP BY status, status_short
ORDER BY count DESC;

-- Step 2: Recreate the v_pick_scores view with proper status matching
DROP VIEW IF EXISTS public.v_leaderboard CASCADE;
DROP VIEW IF EXISTS public.v_pick_scores CASCADE;

CREATE OR REPLACE VIEW public.v_pick_scores AS
SELECT
  p.id           as pick_id,
  p.user_id,
  p.pool_id,
  p.fixture_id,
  p.home_pick,
  p.away_pick,
  f.home_score,
  f.away_score,
  f.status,
  f.status_short,
  CASE
    -- Only calculate points if match is finished
    WHEN f.status_short NOT IN ('FT','AET','PEN') THEN 0
    -- No scores means no points
    WHEN f.home_score IS NULL OR f.away_score IS NULL THEN 0
    -- Exact match: 3 points
    WHEN p.home_pick = f.home_score AND p.away_pick = f.away_score THEN 3
    -- Correct outcome (win/draw): 1 point
    WHEN SIGN(p.home_pick - p.away_pick) = SIGN(COALESCE(f.home_score, 0) - COALESCE(f.away_score, 0)) THEN 1
    -- Incorrect: 0 points
    ELSE 0
  END AS points,
  CASE
    WHEN f.status_short NOT IN ('FT','AET','PEN') THEN false
    WHEN p.home_pick = f.home_score AND p.away_pick = f.away_score THEN true
    ELSE false
  END AS is_exact
FROM public.picks p
JOIN public.fixtures f ON f.id = p.fixture_id;

-- Step 3: Recreate the leaderboard view
CREATE OR REPLACE VIEW public.v_leaderboard AS
SELECT
  vs.pool_id,
  vs.user_id,
  pr.display_name,
  pr.avatar_url,
  COUNT(*) AS picks_made,
  COALESCE(SUM(vs.points), 0) AS points,
  COALESCE(SUM(CASE WHEN vs.is_exact THEN 1 ELSE 0 END), 0) AS exact_count
FROM public.v_pick_scores vs
JOIN public.profiles pr ON pr.id = vs.user_id
GROUP BY vs.pool_id, vs.user_id, pr.display_name, pr.avatar_url
ORDER BY points DESC, exact_count DESC;

-- Step 4: Verify the views exist and work
SELECT 'v_pick_scores' as view_name, COUNT(*) as row_count FROM public.v_pick_scores
UNION ALL
SELECT 'v_leaderboard' as view_name, COUNT(*) as row_count FROM public.v_leaderboard;

-- Step 5: Show sample points calculation for debugging
SELECT
  p.user_id,
  pr.display_name,
  p.pool_id,
  f.home_team,
  f.away_team,
  p.home_pick,
  p.away_pick,
  f.home_score,
  f.away_score,
  f.status_short,
  vs.points
FROM public.picks p
JOIN public.fixtures f ON f.id = p.fixture_id
JOIN public.profiles pr ON pr.id = p.user_id
JOIN public.v_pick_scores vs ON vs.pick_id = p.id
WHERE f.status_short IN ('FT','AET','PEN')
LIMIT 10;
