-- DEBUG: Check why scores aren't showing and points aren't calculating

-- 1. Check if any matches have finished
SELECT
  COUNT(*) as total_matches,
  COUNT(CASE WHEN status_short = 'FT' THEN 1 END) as finished_matches,
  COUNT(CASE WHEN status_short = 'NS' THEN 1 END) as not_started,
  COUNT(CASE WHEN status_short IN ('1H','2H','ET','HT') THEN 1 END) as live_matches
FROM public.fixtures;

-- 2. Show finished matches with scores
SELECT
  id,
  home_team,
  away_team,
  home_score,
  away_score,
  status_short,
  kickoff_utc
FROM public.fixtures
WHERE status_short = 'FT'
ORDER BY kickoff_utc DESC
LIMIT 10;

-- 3. Check if picks exist for finished matches
SELECT
  f.id as fixture_id,
  f.home_team,
  f.away_team,
  f.home_score,
  f.away_score,
  COUNT(p.id) as pick_count
FROM public.fixtures f
LEFT JOIN public.picks p ON p.fixture_id = f.id
WHERE f.status_short = 'FT'
GROUP BY f.id, f.home_team, f.away_team, f.home_score, f.away_score
LIMIT 10;

-- 4. Sample point calculations
SELECT
  p.id,
  pr.display_name,
  f.home_team,
  f.away_team,
  p.home_pick,
  p.away_pick,
  f.home_score,
  f.away_score,
  CASE
    WHEN f.status_short NOT IN ('FT','AET','PEN') THEN 0
    WHEN f.home_score IS NULL OR f.away_score IS NULL THEN 0
    WHEN p.home_pick = f.home_score AND p.away_pick = f.away_score THEN 3
    WHEN SIGN(p.home_pick - p.away_pick) = SIGN(COALESCE(f.home_score, 0) - COALESCE(f.away_score, 0)) THEN 1
    ELSE 0
  END AS points
FROM public.picks p
JOIN public.fixtures f ON f.id = p.fixture_id
JOIN public.profiles pr ON pr.id = p.user_id
WHERE f.status_short = 'FT'
LIMIT 10;

-- 5. Check leaderboard view
SELECT * FROM public.v_leaderboard LIMIT 5;
