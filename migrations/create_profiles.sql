-- Create profiles table for storing user profile information
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  avatar_url text, -- Supabase Storage path or URL
  display_name text, -- Optional custom display name
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index for faster lookups
create index if not exists idx_profiles_user_id on public.profiles(user_id);

-- Enable RLS
alter table public.profiles enable row level security;

-- Allow users to see all profiles (for display in member lists, leaderboard, etc.)
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Users can only insert/update their own profile
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (user_id = auth.uid());

create policy "Users can update their own profile"
  on public.profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Automatically create a profile entry when a user signs up
-- This trigger will create an empty profile for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
