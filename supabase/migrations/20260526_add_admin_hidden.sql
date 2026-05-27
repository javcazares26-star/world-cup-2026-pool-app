-- Add admin_hidden column to pools table
alter table public.pools add column if not exists admin_hidden boolean not null default false;

-- Create index for filtering hidden pools
create index if not exists pools_admin_hidden_idx on public.pools(admin_hidden);

-- Comment for clarity
comment on column public.pools.admin_hidden is 'When true, the pool owner is hidden from Members list and Leaderboard, but retains all access and can see everything in the Admin panel.';
