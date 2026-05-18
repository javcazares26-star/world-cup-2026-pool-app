-- =========================================================================
-- TEST FIXTURES for World Cup 2026 Pool app
-- =========================================================================
-- Paste this entire file into Supabase SQL Editor and click Run.
-- 24 fixtures across all 12 groups: 8 finished (FT), 4 live (1H/2H/HT), 12 upcoming (NS).
--
-- IMPORTANT: Delete these rows before going live with real API-Football data:
--   DELETE FROM public.fixtures WHERE id BETWEEN 900001 AND 900024;
-- =========================================================================

INSERT INTO public.fixtures (
  id, league_id, season, round, group_label, kickoff_utc,
  status, status_short, minute,
  home_team_id, home_team, home_logo,
  away_team_id, away_team, away_logo,
  home_score, away_score, venue, city
) VALUES

-- ========== FINISHED MATCHES (you can see scoring/leaderboard) ==========

(900001, 1, 2026, 'Group Stage - 1', 'Group A', '2026-06-11 20:00:00+00',
  'Match Finished', 'FT', 90, 2382, 'Mexico', 'https://media.api-sports.io/football/teams/16.png',
  2383, 'Canada', 'https://media.api-sports.io/football/teams/1530.png',
  2, 1, 'Estadio Azteca', 'Mexico City'),

(900002, 1, 2026, 'Group Stage - 1', 'Group B', '2026-06-12 00:00:00+00',
  'Match Finished', 'FT', 90, 2384, 'USA', 'https://media.api-sports.io/football/teams/2384.png',
  2385, 'Uruguay', 'https://media.api-sports.io/football/teams/7.png',
  1, 1, 'MetLife Stadium', 'East Rutherford'),

(900003, 1, 2026, 'Group Stage - 1', 'Group C', '2026-06-12 20:00:00+00',
  'Match Finished', 'FT', 90, 26, 'Argentina', 'https://media.api-sports.io/football/teams/26.png',
  3, 'Croatia', 'https://media.api-sports.io/football/teams/3.png',
  3, 0, 'AT&T Stadium', 'Arlington'),

(900004, 1, 2026, 'Group Stage - 1', 'Group D', '2026-06-13 00:00:00+00',
  'Match Finished', 'FT', 90, 2, 'France', 'https://media.api-sports.io/football/teams/2.png',
  1095, 'Denmark', 'https://media.api-sports.io/football/teams/1095.png',
  2, 1, 'SoFi Stadium', 'Los Angeles'),

(900005, 1, 2026, 'Group Stage - 1', 'Group E', '2026-06-13 20:00:00+00',
  'Match Finished', 'FT', 90, 6, 'Brazil', 'https://media.api-sports.io/football/teams/6.png',
  10, 'Senegal', 'https://media.api-sports.io/football/teams/10.png',
  2, 0, 'Mercedes-Benz Stadium', 'Atlanta'),

(900006, 1, 2026, 'Group Stage - 1', 'Group F', '2026-06-14 00:00:00+00',
  'Match Finished', 'FT', 90, 9, 'Spain', 'https://media.api-sports.io/football/teams/9.png',
  31, 'Morocco', 'https://media.api-sports.io/football/teams/31.png',
  3, 1, 'NRG Stadium', 'Houston'),

(900007, 1, 2026, 'Group Stage - 1', 'Group G', '2026-06-14 20:00:00+00',
  'Match Finished', 'FT', 90, 10, 'England', 'https://media.api-sports.io/football/teams/10.png',
  24, 'Poland', 'https://media.api-sports.io/football/teams/24.png',
  2, 1, 'Lincoln Financial Field', 'Philadelphia'),

(900008, 1, 2026, 'Group Stage - 1', 'Group H', '2026-06-15 00:00:00+00',
  'Match Finished', 'FT', 90, 1118, 'Netherlands', 'https://media.api-sports.io/football/teams/1118.png',
  7, 'Ecuador', 'https://media.api-sports.io/football/teams/7.png',
  1, 1, 'Hard Rock Stadium', 'Miami'),

-- ========== LIVE MATCHES (you can see the LIVE indicator + score) ==========

(900009, 1, 2026, 'Group Stage - 1', 'Group I', '2026-06-15 20:00:00+00',
  'First Half', '1H', 35, 27, 'Portugal', 'https://media.api-sports.io/football/teams/27.png',
  20, 'Serbia', 'https://media.api-sports.io/football/teams/20.png',
  1, 0, 'BMO Stadium', 'Toronto'),

(900010, 1, 2026, 'Group Stage - 1', 'Group J', '2026-06-15 22:00:00+00',
  'Halftime', 'HT', 45, 25, 'Germany', 'https://media.api-sports.io/football/teams/25.png',
  12, 'Japan', 'https://media.api-sports.io/football/teams/12.png',
  0, 0, 'Levi''s Stadium', 'Santa Clara'),

(900011, 1, 2026, 'Group Stage - 1', 'Group K', '2026-06-16 00:00:00+00',
  'Second Half', '2H', 67, 1, 'Belgium', 'https://media.api-sports.io/football/teams/1.png',
  8, 'Colombia', 'https://media.api-sports.io/football/teams/8.png',
  1, 1, 'GEHA Field at Arrowhead Stadium', 'Kansas City'),

(900012, 1, 2026, 'Group Stage - 1', 'Group L', '2026-06-16 02:00:00+00',
  'First Half', '1H', 22, 768, 'Italy', 'https://media.api-sports.io/football/teams/768.png',
  771, 'Austria', 'https://media.api-sports.io/football/teams/771.png',
  0, 0, 'Gillette Stadium', 'Foxborough'),

-- ========== UPCOMING MATCHES (these are what you predict) ==========

(900013, 1, 2026, 'Group Stage - 2', 'Group A', '2026-06-17 20:00:00+00',
  'Not Started', 'NS', NULL, 2382, 'Mexico', 'https://media.api-sports.io/football/teams/16.png',
  111, 'Costa Rica', 'https://media.api-sports.io/football/teams/111.png',
  NULL, NULL, 'Estadio Akron', 'Guadalajara'),

(900014, 1, 2026, 'Group Stage - 2', 'Group B', '2026-06-18 00:00:00+00',
  'Not Started', 'NS', NULL, 2384, 'USA', 'https://media.api-sports.io/football/teams/2384.png',
  2386, 'Tunisia', 'https://media.api-sports.io/football/teams/14.png',
  NULL, NULL, 'Lumen Field', 'Seattle'),

(900015, 1, 2026, 'Group Stage - 2', 'Group C', '2026-06-18 20:00:00+00',
  'Not Started', 'NS', NULL, 26, 'Argentina', 'https://media.api-sports.io/football/teams/26.png',
  5, 'Nigeria', 'https://media.api-sports.io/football/teams/21.png',
  NULL, NULL, 'AT&T Stadium', 'Arlington'),

(900016, 1, 2026, 'Group Stage - 2', 'Group D', '2026-06-19 00:00:00+00',
  'Not Started', 'NS', NULL, 2, 'France', 'https://media.api-sports.io/football/teams/2.png',
  21, 'Egypt', 'https://media.api-sports.io/football/teams/22.png',
  NULL, NULL, 'SoFi Stadium', 'Los Angeles'),

(900017, 1, 2026, 'Group Stage - 2', 'Group E', '2026-06-19 20:00:00+00',
  'Not Started', 'NS', NULL, 6, 'Brazil', 'https://media.api-sports.io/football/teams/6.png',
  17, 'South Korea', 'https://media.api-sports.io/football/teams/17.png',
  NULL, NULL, 'NRG Stadium', 'Houston'),

(900018, 1, 2026, 'Group Stage - 2', 'Group F', '2026-06-20 00:00:00+00',
  'Not Started', 'NS', NULL, 9, 'Spain', 'https://media.api-sports.io/football/teams/9.png',
  22, 'Iran', 'https://media.api-sports.io/football/teams/15.png',
  NULL, NULL, 'Mercedes-Benz Stadium', 'Atlanta'),

(900019, 1, 2026, 'Group Stage - 2', 'Group G', '2026-06-20 20:00:00+00',
  'Not Started', 'NS', NULL, 10, 'England', 'https://media.api-sports.io/football/teams/10.png',
  1504, 'Ivory Coast', 'https://media.api-sports.io/football/teams/27.png',
  NULL, NULL, 'Lincoln Financial Field', 'Philadelphia'),

(900020, 1, 2026, 'Group Stage - 2', 'Group H', '2026-06-21 00:00:00+00',
  'Not Started', 'NS', NULL, 1118, 'Netherlands', 'https://media.api-sports.io/football/teams/1118.png',
  29, 'Ghana', 'https://media.api-sports.io/football/teams/29.png',
  NULL, NULL, 'Hard Rock Stadium', 'Miami'),

(900021, 1, 2026, 'Group Stage - 2', 'Group I', '2026-06-21 20:00:00+00',
  'Not Started', 'NS', NULL, 27, 'Portugal', 'https://media.api-sports.io/football/teams/27.png',
  1531, 'Cameroon', 'https://media.api-sports.io/football/teams/1531.png',
  NULL, NULL, 'BMO Stadium', 'Toronto'),

(900022, 1, 2026, 'Group Stage - 2', 'Group J', '2026-06-22 00:00:00+00',
  'Not Started', 'NS', NULL, 25, 'Germany', 'https://media.api-sports.io/football/teams/25.png',
  18, 'Norway', 'https://media.api-sports.io/football/teams/18.png',
  NULL, NULL, 'Levi''s Stadium', 'Santa Clara'),

(900023, 1, 2026, 'Group Stage - 2', 'Group K', '2026-06-22 20:00:00+00',
  'Not Started', 'NS', NULL, 1, 'Belgium', 'https://media.api-sports.io/football/teams/1.png',
  19, 'Turkey', 'https://media.api-sports.io/football/teams/19.png',
  NULL, NULL, 'GEHA Field at Arrowhead Stadium', 'Kansas City'),

(900024, 1, 2026, 'Group Stage - 2', 'Group L', '2026-06-23 00:00:00+00',
  'Not Started', 'NS', NULL, 768, 'Italy', 'https://media.api-sports.io/football/teams/768.png',
  4, 'Algeria', 'https://media.api-sports.io/football/teams/4.png',
  NULL, NULL, 'Gillette Stadium', 'Foxborough')

ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  status_short = EXCLUDED.status_short,
  minute = EXCLUDED.minute,
  home_score = EXCLUDED.home_score,
  away_score = EXCLUDED.away_score,
  updated_at = now();

-- Confirmation: should print "24 rows inserted/updated"
SELECT count(*) AS test_fixtures_loaded FROM public.fixtures WHERE id BETWEEN 900001 AND 900024;
