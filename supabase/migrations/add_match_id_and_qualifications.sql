-- ============================================================================
-- Add Match Identifiers & Qualified Team Support (May 21, 2026)
-- ============================================================================
-- Enables proper display of knockout phase matches with M-IDs (M73, M74, etc.)
-- and team qualifications (1E, 3A, etc.) instead of placeholder group codes

-- ============================================================================
-- 1. Add match_id column to fixtures
-- ============================================================================
-- Match identifier format: M73, M74, etc. (unique per tournament)
alter table if exists public.fixtures
add column if not exists match_id text unique;

create index if not exists fixtures_match_id_idx on public.fixtures(match_id);

-- ============================================================================
-- 2. Add qualified_team_home and qualified_team_away columns
-- ============================================================================
-- Stores qualification labels like "1E" (Winner of Group E), "3A" (3rd place Group A)
-- Used to display match structure before team names are known
alter table if exists public.fixtures
add column if not exists qualified_team_home text;

alter table if exists public.fixtures
add column if not exists qualified_team_away text;

-- ============================================================================
-- 3. Add is_knockout boolean flag
-- ============================================================================
-- Easier filtering than checking for null group_label
alter table if exists public.fixtures
add column if not exists is_knockout boolean default false;

-- Auto-set is_knockout based on group_label presence
update public.fixtures
set is_knockout = true
where group_label is null and round is not null;

create index if not exists fixtures_is_knockout_idx on public.fixtures(is_knockout);

-- ============================================================================
-- FIXTURE DATA STRUCTURE FOR KNOCKOUT PHASE
-- ============================================================================
-- Example knockout fixture before teams are known:
-- {
--   id: 456789,
--   match_id: "M73",
--   round: "Round of 16",
--   group_label: null,
--   qualified_team_home: "1E",
--   qualified_team_away: "2D",
--   home_team: "TBD",
--   away_team: "TBD",
--   is_knockout: true,
--   ...
-- }
--
-- Once group stage completes and teams qualify:
-- {
--   id: 456789,
--   match_id: "M73",
--   round: "Round of 16",
--   group_label: null,
--   qualified_team_home: "1E",
--   qualified_team_away: "2D",
--   home_team: "Spain",        ← Updated with actual winner of Group E
--   away_team: "Uruguay",      ← Updated with actual 2nd place from Group D
--   is_knockout: true,
--   ...
-- }

-- ============================================================================
-- QUALIFICATION LABEL REFERENCE
-- ============================================================================
-- Group Winners: 1A, 1B, 1C, 1D, 1E, 1F, 1G, 1H, 1I, 1J, 1K, 1L
-- Runners-up:   2A, 2B, 2C, 2D, 2E, 2F, 2G, 2H, 2I, 2J, 2K, 2L
-- 3rd Place:    3A, 3B, 3C, 3D, 3E, 3F, 3G, 3H, 3I, 3J, 3K, 3L
--
-- Round of 32 bracket:
--   M1: 1A vs 2B   M2: 1B vs 2A   ...   M16: 1H vs 2G
--
-- Round of 16:
--   M17: W1 vs W2   M18: W3 vs W4   ...   M32: W31 vs W32
--
-- (Quarters, Semis, Final follow same pattern with W = winner of previous match)

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check new columns exist:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'fixtures'
-- AND column_name IN ('match_id', 'qualified_team_home', 'qualified_team_away', 'is_knockout');
-- Expected: 4 rows

-- Check knockout fixtures:
-- SELECT match_id, round, qualified_team_home, qualified_team_away, home_team, away_team
-- FROM public.fixtures
-- WHERE is_knockout = true
-- ORDER BY round, match_id
-- LIMIT 10;

-- Check for any fixtures missing match_id (should be empty for non-group matches):
-- SELECT id, round, home_team, away_team FROM public.fixtures
-- WHERE is_knockout = true AND match_id IS NULL;
-- Expected: 0 rows (after sync)
