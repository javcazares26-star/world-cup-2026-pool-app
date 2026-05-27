-- ============================================================================
-- Add Member Acceptance Status Tracking (May 21, 2026)
-- ============================================================================
-- Allows pool owners to accept or decline pending member invitations

-- ============================================================================
-- 1. Add status column to pool_members
-- ============================================================================
alter table if exists public.pool_members
add column if not exists status text not null default 'pending';

-- Add constraint to ensure valid status values
alter table if exists public.pool_members
drop constraint if exists valid_member_status;

alter table if exists public.pool_members
add constraint valid_member_status
check (status in ('pending', 'accepted', 'declined'));

create index if not exists pool_members_status_idx on public.pool_members(status);

-- ============================================================================
-- 2. RPC: accept_pool_member
-- ============================================================================
-- Owner accepts a pending member invitation
create or replace function public.accept_pool_member(p_pool_id uuid, p_user_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  -- Owner-only check
  if not exists (select 1 from public.pools where id = p_pool_id and owner_id = auth.uid()) then
    raise exception 'Only the pool owner can accept members' using errcode = 'P0008';
  end if;

  -- Update status to accepted
  update public.pool_members
  set status = 'accepted'
  where pool_id = p_pool_id and user_id = p_user_id;

  if not found then
    raise exception 'Member not found in pool' using errcode = 'P0009';
  end if;
end;
$$;

-- ============================================================================
-- 3. RPC: decline_pool_member
-- ============================================================================
-- Owner declines a pending member invitation
create or replace function public.decline_pool_member(p_pool_id uuid, p_user_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  -- Owner-only check
  if not exists (select 1 from public.pools where id = p_pool_id and owner_id = auth.uid()) then
    raise exception 'Only the pool owner can decline members' using errcode = 'P00A';
  end if;

  -- Prevent self-decline
  if p_user_id = auth.uid() then
    raise exception 'You cannot decline yourself from a pool' using errcode = 'P00B';
  end if;

  -- Update status to declined
  update public.pool_members
  set status = 'declined'
  where pool_id = p_pool_id and user_id = p_user_id;

  if not found then
    raise exception 'Member not found in pool' using errcode = 'P00C';
  end if;
end;
$$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Verify status column exists with constraint:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'pool_members' AND column_name = 'status';

-- Verify RPCs exist:
-- SELECT proname FROM pg_proc
-- WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
-- AND proname IN ('accept_pool_member', 'decline_pool_member');

-- Check for pending members in a pool:
-- SELECT pm.user_id, pr.display_name, pm.status, pm.joined_at
-- FROM public.pool_members pm
-- JOIN public.profiles pr ON pr.id = pm.user_id
-- WHERE pm.pool_id = '[pool_id]' AND pm.status = 'pending'
-- ORDER BY pm.joined_at;
