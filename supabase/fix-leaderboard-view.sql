-- Fix: Leaderboard view must group by pool_id to calculate points correctly per pool
DROP VIEW IF EXISTS public.v_leaderboard CASCADE;

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

-- Verify view exists
SELECT * FROM pg_views WHERE viewname = 'v_leaderboard';
