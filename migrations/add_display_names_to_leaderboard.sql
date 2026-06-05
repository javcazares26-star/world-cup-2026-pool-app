-- Add display names to leaderboard view
-- This migration updates the v_leaderboard view to include player display names

drop view if exists public.v_leaderboard cascade;

create view public.v_leaderboard as
select
  pm.pool_id,
  pm.user_id,
  coalesce(u.user_metadata->>'name', u.email) as display_name,
  sum(coalesce(ps.points, 0)) + coalesce(wp.points_awarded, 0) as points,
  row_number() over (partition by pm.pool_id order by sum(coalesce(ps.points, 0)) + coalesce(wp.points_awarded, 0) desc, pm.joined_at asc) as rank
from public.pool_members pm
left join public.v_pick_scores ps on ps.user_id = pm.user_id and ps.pool_id = pm.pool_id
left join public.tournament_winner_picks wp on wp.user_id = pm.user_id and wp.pool_id = pm.pool_id
left join auth.users u on u.id = pm.user_id
where pm.pool_id is not null
group by pm.pool_id, pm.user_id, u.user_metadata->>'name', u.email, wp.points_awarded;
