-- =========================================================================
-- POOL CHAT — schema migration
-- Adds a messages table scoped to pools, with realtime + RLS.
-- Members can post/read in their own pools; non-members are blocked.
--
-- Run once in Supabase SQL Editor.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id     uuid NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     text NOT NULL CHECK (char_length(trim(content)) BETWEEN 1 AND 2000),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_pool_created_idx
  ON public.messages (pool_id, created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop pre-existing policies if re-running
DROP POLICY IF EXISTS "members read messages"   ON public.messages;
DROP POLICY IF EXISTS "members post messages"   ON public.messages;
DROP POLICY IF EXISTS "authors delete messages" ON public.messages;

-- Members of a pool can read messages in that pool
CREATE POLICY "members read messages"
  ON public.messages FOR SELECT
  USING (public.is_pool_member(pool_id, auth.uid()));

-- Members can post; must post as themselves
CREATE POLICY "members post messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_pool_member(pool_id, auth.uid())
  );

-- Author can delete their own (lets people retract a typo)
CREATE POLICY "authors delete messages"
  ON public.messages FOR DELETE
  USING (user_id = auth.uid());

-- Enable realtime so the UI gets push updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Quick verification
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_on,
  (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='messages') AS policies
FROM pg_tables WHERE schemaname='public' AND tablename='messages';
