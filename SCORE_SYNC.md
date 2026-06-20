# Live Score Sync & Points — How It Works and How to Make It Reliable

This documents the end-to-end path that takes a real match result from API-Football
all the way to every member's points updating live, and the **three things that must be
true** for it to work in real time.

## The pipeline

```
API-Football  ──►  /api/cron/sync-fixtures  ──►  Supabase `fixtures` (upsert score+status)
                                                        │
                                          Postgres realtime (WebSocket)
                                                        ▼
                              Browser: fixtures update  ──►  leaderboard refetch (v_leaderboard)
                                                        ▼
                                       Points + standings update on screen
```

- Points are credited **only when a match reaches a finished status** (`FT`, `AET`, `PEN`)
  — see `v_pick_scores`. A live 2-1 shows the score but awards no points until the final whistle.
- The leaderboard is a SQL **view** (`v_leaderboard`), so it is always correct the moment it's
  queried. The job of realtime is just to tell the browser *when* to re-query.

## What was fixed in code

`src/app/pools/[code]/_PoolLayout.tsx` — the realtime trigger that refreshes the leaderboard
used to fire **only when a score changed** and **only for group-stage matches**. That missed:

1. **Knockout matches** (they award points too) — the `group_label` guard excluded them.
2. **The final whistle with no last-minute goal** (e.g. 2-1 at 90' → 2-1 FT). Points are
   credited on the `FT` transition, which often carries no score change, so the leaderboard
   never refreshed and points looked stale until a manual reload.

It now refreshes when **any** match (group or knockout) changes score **or** transitions into
a finished status.

## Three things that must be true (operational — check these)

### 1. The cron must actually run often (Vercel plan)

`vercel.json` requests `*/5 * * * *` (every 5 minutes). **Vercel's Hobby/free tier only runs
cron jobs once per day** and allows a limited number — so on Hobby, scores would sync ~once a
day, not live. Pick one:

- **Upgrade to Vercel Pro** (~$20/mo) — the `*/5` schedule then runs as written. Easiest.
- **Keep Hobby + external pinger (free):** create a job at <https://cron-job.org> that GETs
  this URL every 5 minutes during match days:

  ```
  https://mundial2026-aesthion.vercel.app/api/cron/sync-fixtures?secret=YOUR_CRON_SECRET
  ```

  Use the same value as the `CRON_SECRET` env var in Vercel. (The endpoint already accepts
  `?secret=` for exactly this.)

### 2. Supabase realtime must be publishing the right tables

Run this once in the Supabase SQL editor. Without it, the browser never receives the push and
nothing updates until a page reload.

> **Note:** `ALTER PUBLICATION ... ADD TABLE` errors with `42710: relation "x" is already member
> of publication` if the table is already published — and that error aborts the whole batch, so
> the remaining tables never get added. Use this idempotent version, which checks first:

```sql
-- Add tables to realtime only if not already present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='fixtures') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fixtures;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='picks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.picks;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='pools') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pools;
  END IF;
END $$;
```

Verify what's published:

```sql
SELECT tablename FROM pg_publication_tables
WHERE pubname='supabase_realtime' AND schemaname='public'
ORDER BY tablename;
-- Expect to see: fixtures, picks, pools
```

### 3. Realtime payloads must include the OLD row

The goal/finish detection compares the new row against the **old** row. By default Postgres
only sends the primary key in `payload.old`, so old scores/status come back empty. Enable full
old-row data (safe to run repeatedly):

```sql
alter table public.fixtures replica identity full;
alter table public.picks    replica identity full;
```

## Quick verification checklist

1. **Cron alive:** open `…/api/cron/sync-fixtures?secret=YOUR_CRON_SECRET` in a browser →
   should return `{"ok":true,"count":...,"mode":"auto"}`.
2. **Scores landing:** in Supabase, `select home_team, away_team, home_score, away_score,
   status_short from fixtures where status_short in ('FT','AET','PEN');` → finished games have scores.
3. **Points computing:** `select * from v_leaderboard where pool_id = '<your pool id>';` → points reflect finished games.
4. **Live UI:** with the pool open in two browsers, upsert a test score in Supabase and confirm
   the leaderboard and KPIs move without a reload.

## Manual fallback

If a result is ever missing or wrong (API lag), the **Admin → Fixture Manager** tab lets the
pool owner edit a score directly. That write goes through the same realtime path, so points
update for everyone immediately.
