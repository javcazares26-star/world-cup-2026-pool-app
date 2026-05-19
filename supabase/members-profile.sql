-- =========================================================================
-- MEMBER PROFILE EXTENSIONS
-- Adds a `location` column to profiles, plus an UPDATE policy so each user
-- can edit their own profile (location + avatar_url).
--
-- Run once in Supabase SQL Editor.
-- =========================================================================

-- Add location column (free-form text — city, country, "Frisco TX", "Bogotá", etc.)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location text;

-- Make sure users can update their own profile rows
DROP POLICY IF EXISTS "users can update own profile" ON public.profiles;
CREATE POLICY "users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;
