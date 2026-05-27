-- ============================================================================
-- WORLD CUP 2026 POOL APP — SCHEMA FIXES (May 21, 2026)
-- ============================================================================
-- This file contains ONLY the additions/fixes. If you already have the base
-- schema from supabase/schema.sql, run this to add the missing pieces.
--
-- NEVER run this if you haven't run the base supabase/schema.sql first!
-- ============================================================================

-- ============================================================================
-- FIX 1: UPDATE create_pool RPC with collision retry
-- ============================================================================
-- REPLACE THE OLD create_pool FUNCTION with this version
drop function if exists public.create_pool(text, text);

create or replace function public.create_pool(p_name text, p_code text default null)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_pool_id uuid;
  v_code    text;
  v_attempt int := 0;
  v_max_attempts int := 5;
begin
  -- If custom code provided, use it directly. Otherwise, retry random generation.
  if p_code is not null then
    v_code := upper(p_code);
  else
    -- Retry up to 5 times if random code collides
    loop
      v_code := upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
      v_attempt := v_attempt + 1;

      -- Try to insert; if code already exists, unique constraint will fail
      begin
        insert into public.pools (code, name, owner_id) values (v_code, p_name, auth.uid())
        returning id into v_pool_id;
        exit;  -- Success, break loop
      exception when unique_violation then
        if v_attempt >= v_max_attempts then
          raise exception 'Failed to generate unique pool code after % attempts', v_attempt using errcode = 'P0002';
        end if;
        -- Continue loop to retry
      end;
    end loop;
  end if;

  -- If we got here with custom code (not retried), insert now
  if v_pool_id is null then
    insert into public.pools (code, name, owner_id) values (v_code, p_name, auth.uid())
    returning id into v_pool_id;
  end if;

  insert into public.pool_members (pool_id, user_id, role) values (v_pool_id, auth.uid(), 'owner');
  return v_pool_id;
end;
$$;

-- ============================================================================
-- FIX 2: ADD RPC - remove_pool_member
-- ============================================================================
create or replace function public.remove_pool_member(p_pool_id uuid, p_user_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  -- Owner-only check: caller must own the pool
  if not exists (select 1 from public.pools where id = p_pool_id and owner_id = auth.uid()) then
    raise exception 'Only the pool owner can remove members' using errcode = 'P0003';
  end if;

  -- Prevent self-removal
  if p_user_id = auth.uid() then
    raise exception 'You cannot remove yourself from a pool' using errcode = 'P0004';
  end if;

  -- Delete in order: messages, picks, then membership
  delete from public.messages where pool_id = p_pool_id and user_id = p_user_id;
  delete from public.picks where pool_id = p_pool_id and user_id = p_user_id;
  delete from public.pool_members where pool_id = p_pool_id and user_id = p_user_id;
end;
$$;

-- ============================================================================
-- FIX 3: ADD RPC - add_pool_member_by_email
-- ============================================================================
create or replace function public.add_pool_member_by_email(p_pool_id uuid, p_email text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  -- Owner-only check
  if not exists (select 1 from public.pools where id = p_pool_id and owner_id = auth.uid()) then
    raise exception 'Only the pool owner can invite members' using errcode = 'P0005';
  end if;

  -- Find user by email
  select id into v_user_id from auth.users where email = lower(p_email);
  if v_user_id is null then
    raise exception 'User with email % not found' using errcode = 'P0006';
  end if;

  -- Add to pool (ignore if already a member)
  insert into public.pool_members (pool_id, user_id, role)
  values (p_pool_id, v_user_id, 'member')
  on conflict (pool_id, user_id) do nothing;
end;
$$;

-- ============================================================================
-- FIX 4: ADD RPC - delete_pool
-- ============================================================================
create or replace function public.delete_pool(p_pool_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  -- Owner-only check
  if not exists (select 1 from public.pools where id = p_pool_id and owner_id = auth.uid()) then
    raise exception 'Only the pool owner can delete a pool' using errcode = 'P0007';
  end if;

  -- Delete in order: messages, picks, members, then pool
  delete from public.messages where pool_id = p_pool_id;
  delete from public.picks where pool_id = p_pool_id;
  delete from public.pool_members where pool_id = p_pool_id;
  delete from public.pools where id = p_pool_id;
end;
$$;

-- ============================================================================
-- FIX 5: ADD messages table
-- ============================================================================
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  pool_id      uuid not null references public.pools(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  content      text not null,
  created_at   timestamptz default now()
);

create index if not exists messages_pool_idx on public.messages(pool_id);
create index if not exists messages_created_at_idx on public.messages(created_at);

alter table public.messages enable row level security;

create policy "messages visible to pool members"
  on public.messages for select
  using (
    exists (
      select 1 from public.pool_members m
      where m.pool_id = messages.pool_id and m.user_id = auth.uid()
    )
  );

create policy "users insert own messages"
  on public.messages for insert
  with check (user_id = auth.uid());

create policy "users delete own messages"
  on public.messages for delete
  using (user_id = auth.uid());

-- ============================================================================
-- FIX 6: Enable Realtime for messages
-- ============================================================================
alter publication supabase_realtime add table public.messages;

-- ============================================================================
-- FIX 7: Fix score constraint (0-20, not 0-30)
-- ============================================================================
-- Drop and recreate the picks table with corrected constraints
-- WARNING: This will DROP the picks table and recreate it. If you have data,
-- export it first!

-- If you have test data, comment this out and manually fix constraints instead.
-- For a fresh DB, this is safe:

-- Option A: DROP and recreate (safest for fresh DB)
-- drop table if exists public.picks cascade;
-- create table if not exists public.picks (
--   id           uuid primary key default gen_random_uuid(),
--   user_id      uuid not null references public.profiles(id) on delete cascade,
--   pool_id      uuid not null references public.pools(id) on delete cascade,
--   fixture_id   bigint not null references public.fixtures(id) on delete cascade,
--   home_pick    int not null check (home_pick >= 0 and home_pick <= 20),
--   away_pick    int not null check (away_pick >= 0 and away_pick <= 20),
--   locked       boolean not null default false,
--   updated_at   timestamptz default now(),
--   unique (user_id, pool_id, fixture_id)
-- );
-- create index if not exists picks_pool_idx on public.picks(pool_id);
-- create index if not exists picks_user_idx on public.picks(user_id);
-- alter table public.picks enable row level security;
-- ... recreate all RLS policies for picks ...

-- Option B: Alter constraints (if you have data to preserve)
-- This is more complex, so ask for help if needed.

-- ============================================================================
-- VERIFICATION QUERIES (run these to confirm deployment)
-- ============================================================================

-- Verify messages table exists:
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'messages';
-- Expected: 1 row with 'messages'

-- Verify RPC functions exist:
SELECT proname FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN ('remove_pool_member', 'add_pool_member_by_email', 'delete_pool', 'create_pool');
-- Expected: 4 rows

-- Verify Realtime enabled:
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND tablename = 'messages';
-- Expected: 1 row

-- Verify RLS policies on messages:
SELECT policyname FROM pg_policies WHERE tablename = 'messages';
-- Expected: 3 policies

-- ============================================================================
-- ALL DONE!
-- ============================================================================
-- Your schema is now updated with:
-- ✅ Pool code collision retry
-- ✅ Messages table
-- ✅ Three admin RPCs (remove_pool_member, add_pool_member_by_email, delete_pool)
-- ✅ Realtime messaging enabled
-- ⚠️  Score constraint fix (commented out — run manually if you have no data)
-- ============================================================================
