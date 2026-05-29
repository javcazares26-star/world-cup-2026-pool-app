-- Create tournament_winner_picks table
create table if not exists public.tournament_winner_picks (
  id bigint primary key generated always as identity,
  pool_id uuid not null references public.pools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  team_name text not null, -- e.g., "Argentina", "France", "USA"
  locked_at timestamp with time zone, -- when group stage ends / first knockout starts (prevents changes)
  points_awarded integer default 0, -- 0 or 5, set when tournament winner is determined
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  unique(pool_id, user_id) -- one pick per user per pool
);

-- Create index for faster queries
create index if not exists idx_tournament_winner_picks_pool_user
  on public.tournament_winner_picks(pool_id, user_id);

-- Add RLS policies
alter table public.tournament_winner_picks enable row level security;

-- Users can see picks for their pools
create policy "Users can view tournament winner picks for their pools"
  on public.tournament_winner_picks for select
  using (
    exists (
      select 1 from public.pool_members
      where pool_members.pool_id = tournament_winner_picks.pool_id
        and pool_members.user_id = auth.uid()
    )
  );

-- Users can insert/update their own pick
create policy "Users can insert/update their own tournament winner pick"
  on public.tournament_winner_picks for insert
  with check (user_id = auth.uid());

create policy "Users can update their own tournament winner pick"
  on public.tournament_winner_picks for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
