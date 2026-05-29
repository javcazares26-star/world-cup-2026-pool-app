-- Update the leaderboard view to include tournament winner pick points
-- This view needs to combine pick_scores + tournament_winner_pick points

-- Drop and recreate v_leaderboard to include tournament winner pick points
-- This must be done in two steps: drop the old view, then create the new one

drop view if exists public.v_leaderboard cascade;

create view public.v_leaderboard as
select
  pm.pool_id,
  pm.user_id,
  sum(coalesce(ps.points, 0)) + coalesce(wp.points_awarded, 0) as points,
  row_number() over (partition by pm.pool_id order by sum(coalesce(ps.points, 0)) + coalesce(wp.points_awarded, 0) desc, pm.joined_at asc) as rank
from public.pool_members pm
left join public.v_pick_scores ps on ps.user_id = pm.user_id and ps.pool_id = pm.pool_id
left join public.tournament_winner_picks wp on wp.user_id = pm.user_id and wp.pool_id = pm.pool_id
where pm.pool_id is not null
group by pm.pool_id, pm.user_id, wp.points_awarded;

-- Function to award points when tournament winner is determined
-- Call this function once the Final has been played and we know the winner
create or replace function public.award_tournament_winner_points(p_pool_id bigint, p_winning_team text)
returns table(updated_count int)
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  update public.tournament_winner_picks
  set points_awarded = 5,
      updated_at = now()
  where pool_id = p_pool_id
    and team_name = p_winning_team
    and points_awarded = 0; -- Only award once

  get diagnostics v_count = row_count;
  return query select v_count;
end;
$$;

-- Note: After the Final match is played (July 19, 2026), you can:
-- 1. Query the Final fixture to get the winning team
-- 2. Run: SELECT * FROM public.award_tournament_winner_points(YOUR_POOL_ID, 'Argentina');
-- 3. The leaderboard will automatically update with the +5 points for correct picks
