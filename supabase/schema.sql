-- =========================================================================
-- World Cup 2026 Score Pool — Supabase schema
-- Paste this entire file into Supabase SQL editor (Database → SQL Editor → New query)
-- =========================================================================

-- ====== EXTENSIONS ======
create extension if not exists "pgcrypto";

-- ====== PROFILES ======
-- Mirrors auth.users with a display name + avatar. Auto-created on signup.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url   text,
  locale       text default 'en',
  created_at   timestamptz default now()
);

-- ====== POOLS ======
-- A "pool" is one private league of friends/family.
create table if not exists public.pools (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,                    -- shareable invite code, e.g. "MEXFAM26"
  name         text not null,
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  scoring      jsonb not null default '{"exact":3,"outcome":1,"miss":0}'::jsonb,
  is_public    boolean not null default false,
  created_at   timestamptz default now()
);
create index if not exists pools_owner_idx on public.pools(owner_id);

-- ====== POOL MEMBERS ======
create table if not exists public.pool_members (
  pool_id   uuid references public.pools(id) on delete cascade,
  user_id   uuid references public.profiles(id) on delete cascade,
  role      text not null default 'member',   -- 'owner' | 'member'
  joined_at timestamptz default now(),
  primary key (pool_id, user_id)
);
create index if not exists pool_members_user_idx on public.pool_members(user_id);

-- ====== FIXTURES ======
-- Synced from API-Football. One row per match.
create table if not exists public.fixtures (
  id              bigint primary key,            -- API-Football fixture id
  league_id       int not null,
  season          int not null,
  round           text,                           -- "Group Stage - 1", "Round of 32", etc.
  group_label     text,                           -- "Group A".."Group L" (derived)
  kickoff_utc     timestamptz not null,
  status          text not null,                  -- 'NS' (not started) | 'LIVE' | 'FT' | 'HT' | 'PST'
  status_short    text,
  minute          int,
  home_team_id    int,
  home_team       text not null,
  home_logo       text,
  away_team_id    int,
  away_team       text not null,
  away_logo       text,
  home_score      int,                            -- null until match starts; final at FT
  away_score      int,
  venue           text,
  city            text,
  updated_at      timestamptz default now()
);
create index if not exists fixtures_kickoff_idx on public.fixtures(kickoff_utc);
create index if not exists fixtures_status_idx  on public.fixtures(status);

-- ====== PICKS ======
create table if not exists public.picks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  pool_id      uuid not null references public.pools(id) on delete cascade,
  fixture_id   bigint not null references public.fixtures(id) on delete cascade,
  home_pick    int not null check (home_pick >= 0 and home_pick <= 30),
  away_pick    int not null check (away_pick >= 0 and away_pick <= 30),
  locked       boolean not null default false,    -- set true at kickoff
  updated_at   timestamptz default now(),
  unique (user_id, pool_id, fixture_id)
);
create index if not exists picks_pool_idx on public.picks(pool_id);
create index if not exists picks_user_idx on public.picks(user_id);

-- ====== AUTO-CREATE PROFILE ON SIGNUP ======
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ====== SCORING VIEW (leaderboard) ======
-- Joins picks ↔ fixtures, computes points per pick, sums per (pool, user).
create or replace view public.v_pick_scores as
select
  p.id           as pick_id,
  p.user_id,
  p.pool_id,
  p.fixture_id,
  p.home_pick, p.away_pick,
  f.home_score, f.away_score, f.status,
  case
    when f.status not in ('FT','AET','PEN') then 0
    when p.home_pick = f.home_score and p.away_pick = f.away_score then 3
    when sign(p.home_pick - p.away_pick) = sign(coalesce(f.home_score,0) - coalesce(f.away_score,0)) then 1
    else 0
  end as points,
  case
    when f.status not in ('FT','AET','PEN') then false
    when p.home_pick = f.home_score and p.away_pick = f.away_score then true
    else false
  end as is_exact
from public.picks p
join public.fixtures f on f.id = p.fixture_id;

create or replace view public.v_leaderboard as
select
  vs.pool_id,
  vs.user_id,
  pr.display_name,
  pr.avatar_url,
  count(*)                                     as picks_made,
  coalesce(sum(vs.points), 0)                  as points,
  coalesce(sum(case when vs.is_exact then 1 else 0 end), 0) as exact_count
from public.v_pick_scores vs
join public.profiles pr on pr.id = vs.user_id
group by vs.pool_id, vs.user_id, pr.display_name, pr.avatar_url
order by points desc, exact_count desc;

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================

alter table public.profiles    enable row level security;
alter table public.pools       enable row level security;
alter table public.pool_members enable row level security;
alter table public.fixtures    enable row level security;
alter table public.picks       enable row level security;

-- ----- PROFILES -----
create policy "profiles are readable by everyone"
  on public.profiles for select using (true);
create policy "users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ----- POOLS -----
-- See pool if: you're a member, you own it, or it's public.
create policy "pool visibility"
  on public.pools for select
  using (
    is_public
    or owner_id = auth.uid()
    or exists (select 1 from public.pool_members m where m.pool_id = pools.id and m.user_id = auth.uid())
  );
create policy "authenticated can create pools"
  on public.pools for insert with check (auth.uid() = owner_id);
create policy "owner can update pool"
  on public.pools for update using (owner_id = auth.uid());
create policy "owner can delete pool"
  on public.pools for delete using (owner_id = auth.uid());

-- ----- POOL MEMBERS -----
create policy "members visible to pool members"
  on public.pool_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.pool_members m2
      where m2.pool_id = pool_members.pool_id and m2.user_id = auth.uid()
    )
  );
create policy "self-join pool"
  on public.pool_members for insert with check (user_id = auth.uid());
create policy "self-leave pool"
  on public.pool_members for delete using (user_id = auth.uid());

-- ----- FIXTURES -----
-- Public read for everyone (no PII). Only service role writes (via cron).
create policy "fixtures readable by all"
  on public.fixtures for select using (true);

-- ----- PICKS -----
-- See picks if: it's yours OR you're in the same pool (so leaderboard works).
create policy "pick visibility"
  on public.picks for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.pool_members m
      where m.pool_id = picks.pool_id and m.user_id = auth.uid()
    )
  );
create policy "users insert own picks"
  on public.picks for insert with check (user_id = auth.uid());
create policy "users update own unlocked picks"
  on public.picks for update
  using (user_id = auth.uid() and locked = false);
create policy "users delete own unlocked picks"
  on public.picks for delete
  using (user_id = auth.uid() and locked = false);

-- =========================================================================
-- REALTIME — broadcast fixture + leaderboard changes
-- =========================================================================
alter publication supabase_realtime add table public.fixtures;
alter publication supabase_realtime add table public.picks;

-- =========================================================================
-- RPC: join_pool_by_code
-- Atomic: validates code, adds caller to pool_members.
-- =========================================================================
create or replace function public.join_pool_by_code(pool_code text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_pool_id uuid;
begin
  select id into v_pool_id from public.pools where code = upper(pool_code);
  if v_pool_id is null then
    raise exception 'Pool code not found' using errcode = 'P0001';
  end if;
  insert into public.pool_members (pool_id, user_id, role)
  values (v_pool_id, auth.uid(), 'member')
  on conflict do nothing;
  return v_pool_id;
end;
$$;

-- =========================================================================
-- RPC: create_pool
-- Atomic: insert pool + add owner as member.
-- =========================================================================
create or replace function public.create_pool(p_name text, p_code text default null)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_pool_id uuid;
  v_code    text;
begin
  v_code := coalesce(upper(p_code), upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6)));
  insert into public.pools (code, name, owner_id) values (v_code, p_name, auth.uid())
  returning id into v_pool_id;
  insert into public.pool_members (pool_id, user_id, role) values (v_pool_id, auth.uid(), 'owner');
  return v_pool_id;
end;
$$;
