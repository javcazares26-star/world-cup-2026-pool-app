-- Add admin_hidden field to pools table
-- Allows pool owner/admin to hide themselves from Members and Leaderboard
-- but still access all pool features including chat and admin controls

ALTER TABLE public.pools
ADD COLUMN admin_hidden boolean NOT NULL DEFAULT false;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS pools_admin_hidden_idx ON public.pools(admin_hidden);

COMMENT ON COLUMN public.pools.admin_hidden IS 'When true, the pool owner is hidden from Members and Leaderboard views, but can still access all features and admin controls';
