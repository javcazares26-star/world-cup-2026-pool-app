-- Add is_admin column to pool_members table to allow promoting members to admins
ALTER TABLE public.pool_members ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pool_members_is_admin ON public.pool_members(pool_id, is_admin);
