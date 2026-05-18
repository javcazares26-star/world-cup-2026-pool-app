-- =========================================================================
-- 2026 FIFA WORLD CUP — Real Fixtures (all 104 matches)
-- Source: official 2026 schedule (USA/Canada/Mexico)
-- Times stored in UTC. US EDT (UTC-4) shown in comments for reference.
--
-- Run this in Supabase SQL Editor:
--   1. Click New Query
--   2. Paste this entire file
--   3. Click Run
--
-- Idempotent: re-running updates existing rows. Safe to run multiple times.
-- =========================================================================

-- Wipe the old test fixtures
DELETE FROM public.fixtures WHERE id BETWEEN 900001 AND 900024;

-- Insert all 104 matches
INSERT INTO public.fixtures (
  id, league_id, season, round, group_label, kickoff_utc,
  status, status_short, minute,
  home_team_id, home_team, home_logo,
  away_team_id, away_team, away_logo,
  home_score, away_score, venue, city
) VALUES

-- ====== GROUP STAGE — MATCHDAY 1 (matches 1-12 reordered by match number) ======
(900001, 1, 2026, 'Group Stage - 1', 'Group A', '2026-06-11 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Mexico',        NULL, NULL, 'South Africa', NULL, NULL, NULL, 'Estadio Azteca', 'Mexico City'),
(900002, 1, 2026, 'Group Stage - 1', 'Group A', '2026-06-12 02:00:00+00', 'Not Started', 'NS', NULL, NULL, 'South Korea',   NULL, NULL, 'UEFA D',       NULL, NULL, NULL, 'Estadio Akron', 'Zapopan'),
(900003, 1, 2026, 'Group Stage - 1', 'Group B', '2026-06-12 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Canada',        NULL, NULL, 'UEFA A',       NULL, NULL, NULL, 'BMO Field', 'Toronto'),
(900004, 1, 2026, 'Group Stage - 1', 'Group D', '2026-06-13 01:00:00+00', 'Not Started', 'NS', NULL, NULL, 'United States', NULL, NULL, 'Paraguay',     NULL, NULL, NULL, 'SoFi Stadium', 'Inglewood'),
(900005, 1, 2026, 'Group Stage - 1', 'Group C', '2026-06-14 01:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Haiti',         NULL, NULL, 'Scotland',     NULL, NULL, NULL, 'Gillette Stadium', 'Foxborough'),
(900006, 1, 2026, 'Group Stage - 1', 'Group D', '2026-06-14 03:59:00+00', 'Not Started', 'NS', NULL, NULL, 'Australia',     NULL, NULL, 'UEFA C',       NULL, NULL, NULL, 'BC Place', 'Vancouver'),
(900007, 1, 2026, 'Group Stage - 1', 'Group C', '2026-06-13 22:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Brazil',        NULL, NULL, 'Morocco',      NULL, NULL, NULL, 'MetLife Stadium', 'East Rutherford'),
(900008, 1, 2026, 'Group Stage - 1', 'Group B', '2026-06-13 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Qatar',         NULL, NULL, 'Switzerland',  NULL, NULL, NULL, 'Levi''s Stadium', 'Santa Clara'),
(900009, 1, 2026, 'Group Stage - 1', 'Group E', '2026-06-14 23:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Ivory Coast',   NULL, NULL, 'Ecuador',      NULL, NULL, NULL, 'Lincoln Financial Field', 'Philadelphia'),
(900010, 1, 2026, 'Group Stage - 1', 'Group E', '2026-06-14 17:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Germany',       NULL, NULL, 'Curacao',      NULL, NULL, NULL, 'NRG Stadium', 'Houston'),
(900011, 1, 2026, 'Group Stage - 1', 'Group F', '2026-06-14 20:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Netherlands',   NULL, NULL, 'Japan',        NULL, NULL, NULL, 'AT&T Stadium', 'Arlington'),
(900012, 1, 2026, 'Group Stage - 1', 'Group F', '2026-06-15 02:00:00+00', 'Not Started', 'NS', NULL, NULL, 'UEFA B',        NULL, NULL, 'Tunisia',      NULL, NULL, NULL, 'Estadio BBVA', 'Guadalupe'),
(900013, 1, 2026, 'Group Stage - 1', 'Group H', '2026-06-15 22:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Saudi Arabia',  NULL, NULL, 'Uruguay',      NULL, NULL, NULL, 'Hard Rock Stadium', 'Miami Gardens'),
(900014, 1, 2026, 'Group Stage - 1', 'Group H', '2026-06-15 16:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Spain',         NULL, NULL, 'Cape Verde',   NULL, NULL, NULL, 'Mercedes-Benz Stadium', 'Atlanta'),
(900015, 1, 2026, 'Group Stage - 1', 'Group G', '2026-06-16 01:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Iran',          NULL, NULL, 'New Zealand',  NULL, NULL, NULL, 'SoFi Stadium', 'Inglewood'),
(900016, 1, 2026, 'Group Stage - 1', 'Group G', '2026-06-15 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Belgium',       NULL, NULL, 'Egypt',        NULL, NULL, NULL, 'Lumen Field', 'Seattle'),
(900017, 1, 2026, 'Group Stage - 1', 'Group I', '2026-06-16 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'France',        NULL, NULL, 'Senegal',      NULL, NULL, NULL, 'MetLife Stadium', 'East Rutherford'),
(900018, 1, 2026, 'Group Stage - 1', 'Group I', '2026-06-16 22:00:00+00', 'Not Started', 'NS', NULL, NULL, 'FIFA 2',        NULL, NULL, 'Norway',       NULL, NULL, NULL, 'Gillette Stadium', 'Foxborough'),
(900019, 1, 2026, 'Group Stage - 1', 'Group J', '2026-06-17 01:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Argentina',     NULL, NULL, 'Algeria',      NULL, NULL, NULL, 'Arrowhead Stadium', 'Kansas City'),
(900020, 1, 2026, 'Group Stage - 1', 'Group J', '2026-06-17 03:59:00+00', 'Not Started', 'NS', NULL, NULL, 'Austria',       NULL, NULL, 'Jordan',       NULL, NULL, NULL, 'Levi''s Stadium', 'Santa Clara'),
(900021, 1, 2026, 'Group Stage - 1', 'Group L', '2026-06-17 20:00:00+00', 'Not Started', 'NS', NULL, NULL, 'England',       NULL, NULL, 'Croatia',      NULL, NULL, NULL, 'AT&T Stadium', 'Arlington'),
(900022, 1, 2026, 'Group Stage - 1', 'Group L', '2026-06-17 23:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Ghana',         NULL, NULL, 'Panama',       NULL, NULL, NULL, 'BMO Field', 'Toronto'),
(900023, 1, 2026, 'Group Stage - 1', 'Group K', '2026-06-17 17:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Portugal',      NULL, NULL, 'FIFA 1',       NULL, NULL, NULL, 'NRG Stadium', 'Houston'),
(900024, 1, 2026, 'Group Stage - 1', 'Group K', '2026-06-18 02:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Uzbekistan',    NULL, NULL, 'Colombia',     NULL, NULL, NULL, 'Estadio Azteca', 'Mexico City'),

-- ====== GROUP STAGE — MATCHDAY 2 ======
(900025, 1, 2026, 'Group Stage - 2', 'Group A', '2026-06-18 16:00:00+00', 'Not Started', 'NS', NULL, NULL, 'UEFA D',        NULL, NULL, 'South Africa', NULL, NULL, NULL, 'Mercedes-Benz Stadium', 'Atlanta'),
(900026, 1, 2026, 'Group Stage - 2', 'Group B', '2026-06-18 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Switzerland',   NULL, NULL, 'UEFA A',       NULL, NULL, NULL, 'SoFi Stadium', 'Inglewood'),
(900027, 1, 2026, 'Group Stage - 2', 'Group B', '2026-06-18 22:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Canada',        NULL, NULL, 'Qatar',        NULL, NULL, NULL, 'BC Place', 'Vancouver'),
(900028, 1, 2026, 'Group Stage - 2', 'Group A', '2026-06-19 01:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Mexico',        NULL, NULL, 'South Korea',  NULL, NULL, NULL, 'Estadio Akron', 'Zapopan'),
(900029, 1, 2026, 'Group Stage - 2', 'Group C', '2026-06-20 01:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Brazil',        NULL, NULL, 'Haiti',        NULL, NULL, NULL, 'Lincoln Financial Field', 'Philadelphia'),
(900030, 1, 2026, 'Group Stage - 2', 'Group C', '2026-06-19 22:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Scotland',      NULL, NULL, 'Morocco',      NULL, NULL, NULL, 'Gillette Stadium', 'Foxborough'),
(900031, 1, 2026, 'Group Stage - 2', 'Group D', '2026-06-20 03:59:00+00', 'Not Started', 'NS', NULL, NULL, 'UEFA C',        NULL, NULL, 'Paraguay',     NULL, NULL, NULL, 'Levi''s Stadium', 'Santa Clara'),
(900032, 1, 2026, 'Group Stage - 2', 'Group D', '2026-06-19 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'United States', NULL, NULL, 'Australia',    NULL, NULL, NULL, 'Lumen Field', 'Seattle'),
(900033, 1, 2026, 'Group Stage - 2', 'Group E', '2026-06-20 20:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Germany',       NULL, NULL, 'Ivory Coast',  NULL, NULL, NULL, 'BMO Field', 'Toronto'),
(900034, 1, 2026, 'Group Stage - 2', 'Group E', '2026-06-21 00:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Ecuador',       NULL, NULL, 'Curacao',      NULL, NULL, NULL, 'Arrowhead Stadium', 'Kansas City'),
(900035, 1, 2026, 'Group Stage - 2', 'Group F', '2026-06-20 17:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Netherlands',   NULL, NULL, 'UEFA B',       NULL, NULL, NULL, 'NRG Stadium', 'Houston'),
(900036, 1, 2026, 'Group Stage - 2', 'Group F', '2026-06-21 03:59:00+00', 'Not Started', 'NS', NULL, NULL, 'Tunisia',       NULL, NULL, 'Japan',        NULL, NULL, NULL, 'Estadio BBVA', 'Guadalupe'),
(900037, 1, 2026, 'Group Stage - 2', 'Group H', '2026-06-21 22:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Uruguay',       NULL, NULL, 'Cape Verde',   NULL, NULL, NULL, 'Hard Rock Stadium', 'Miami Gardens'),
(900038, 1, 2026, 'Group Stage - 2', 'Group H', '2026-06-21 16:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Spain',         NULL, NULL, 'Saudi Arabia', NULL, NULL, NULL, 'Mercedes-Benz Stadium', 'Atlanta'),
(900039, 1, 2026, 'Group Stage - 2', 'Group G', '2026-06-21 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Belgium',       NULL, NULL, 'Iran',         NULL, NULL, NULL, 'SoFi Stadium', 'Inglewood'),
(900040, 1, 2026, 'Group Stage - 2', 'Group G', '2026-06-22 01:00:00+00', 'Not Started', 'NS', NULL, NULL, 'New Zealand',   NULL, NULL, 'Egypt',        NULL, NULL, NULL, 'BC Place', 'Vancouver'),
(900041, 1, 2026, 'Group Stage - 2', 'Group I', '2026-06-23 00:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Norway',        NULL, NULL, 'Senegal',      NULL, NULL, NULL, 'MetLife Stadium', 'East Rutherford'),
(900042, 1, 2026, 'Group Stage - 2', 'Group I', '2026-06-22 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'France',        NULL, NULL, 'FIFA 2',       NULL, NULL, NULL, 'Lincoln Financial Field', 'Philadelphia'),
(900043, 1, 2026, 'Group Stage - 2', 'Group J', '2026-06-22 17:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Argentina',     NULL, NULL, 'Austria',      NULL, NULL, NULL, 'AT&T Stadium', 'Arlington'),
(900044, 1, 2026, 'Group Stage - 2', 'Group J', '2026-06-23 03:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Jordan',        NULL, NULL, 'Algeria',      NULL, NULL, NULL, 'Levi''s Stadium', 'Santa Clara'),
(900045, 1, 2026, 'Group Stage - 2', 'Group L', '2026-06-23 20:00:00+00', 'Not Started', 'NS', NULL, NULL, 'England',       NULL, NULL, 'Ghana',        NULL, NULL, NULL, 'Gillette Stadium', 'Foxborough'),
(900046, 1, 2026, 'Group Stage - 2', 'Group L', '2026-06-23 23:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Panama',        NULL, NULL, 'Croatia',      NULL, NULL, NULL, 'BMO Field', 'Toronto'),
(900047, 1, 2026, 'Group Stage - 2', 'Group K', '2026-06-23 17:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Portugal',      NULL, NULL, 'Uzbekistan',   NULL, NULL, NULL, 'NRG Stadium', 'Houston'),
(900048, 1, 2026, 'Group Stage - 2', 'Group K', '2026-06-24 02:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Colombia',      NULL, NULL, 'FIFA 1',       NULL, NULL, NULL, 'Estadio Akron', 'Zapopan'),

-- ====== GROUP STAGE — MATCHDAY 3 ======
(900049, 1, 2026, 'Group Stage - 3', 'Group C', '2026-06-24 22:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Scotland',      NULL, NULL, 'Brazil',       NULL, NULL, NULL, 'Hard Rock Stadium', 'Miami Gardens'),
(900050, 1, 2026, 'Group Stage - 3', 'Group C', '2026-06-24 22:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Morocco',       NULL, NULL, 'Haiti',        NULL, NULL, NULL, 'Mercedes-Benz Stadium', 'Atlanta'),
(900051, 1, 2026, 'Group Stage - 3', 'Group B', '2026-06-24 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Switzerland',   NULL, NULL, 'Canada',       NULL, NULL, NULL, 'BC Place', 'Vancouver'),
(900052, 1, 2026, 'Group Stage - 3', 'Group B', '2026-06-24 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'UEFA A',        NULL, NULL, 'Qatar',        NULL, NULL, NULL, 'Lumen Field', 'Seattle'),
(900053, 1, 2026, 'Group Stage - 3', 'Group A', '2026-06-25 01:00:00+00', 'Not Started', 'NS', NULL, NULL, 'UEFA D',        NULL, NULL, 'Mexico',       NULL, NULL, NULL, 'Estadio Azteca', 'Mexico City'),
(900054, 1, 2026, 'Group Stage - 3', 'Group A', '2026-06-25 01:00:00+00', 'Not Started', 'NS', NULL, NULL, 'South Africa',  NULL, NULL, 'South Korea',  NULL, NULL, NULL, 'Estadio BBVA', 'Guadalupe'),
(900055, 1, 2026, 'Group Stage - 3', 'Group E', '2026-06-25 20:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Curacao',       NULL, NULL, 'Ivory Coast',  NULL, NULL, NULL, 'Lincoln Financial Field', 'Philadelphia'),
(900056, 1, 2026, 'Group Stage - 3', 'Group E', '2026-06-25 20:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Ecuador',       NULL, NULL, 'Germany',      NULL, NULL, NULL, 'MetLife Stadium', 'East Rutherford'),
(900057, 1, 2026, 'Group Stage - 3', 'Group F', '2026-06-25 23:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Japan',         NULL, NULL, 'UEFA B',       NULL, NULL, NULL, 'AT&T Stadium', 'Arlington'),
(900058, 1, 2026, 'Group Stage - 3', 'Group F', '2026-06-25 23:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Tunisia',       NULL, NULL, 'Netherlands',  NULL, NULL, NULL, 'Arrowhead Stadium', 'Kansas City'),
(900059, 1, 2026, 'Group Stage - 3', 'Group D', '2026-06-26 02:00:00+00', 'Not Started', 'NS', NULL, NULL, 'UEFA C',        NULL, NULL, 'United States',NULL, NULL, NULL, 'SoFi Stadium', 'Inglewood'),
(900060, 1, 2026, 'Group Stage - 3', 'Group D', '2026-06-26 02:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Paraguay',      NULL, NULL, 'Australia',    NULL, NULL, NULL, 'Levi''s Stadium', 'Santa Clara'),
(900061, 1, 2026, 'Group Stage - 3', 'Group I', '2026-06-26 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Norway',        NULL, NULL, 'France',       NULL, NULL, NULL, 'Gillette Stadium', 'Foxborough'),
(900062, 1, 2026, 'Group Stage - 3', 'Group I', '2026-06-26 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Senegal',       NULL, NULL, 'FIFA 2',       NULL, NULL, NULL, 'BMO Field', 'Toronto'),
(900063, 1, 2026, 'Group Stage - 3', 'Group G', '2026-06-27 03:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Egypt',         NULL, NULL, 'Iran',         NULL, NULL, NULL, 'Lumen Field', 'Seattle'),
(900064, 1, 2026, 'Group Stage - 3', 'Group G', '2026-06-27 03:00:00+00', 'Not Started', 'NS', NULL, NULL, 'New Zealand',   NULL, NULL, 'Belgium',      NULL, NULL, NULL, 'BC Place', 'Vancouver'),
(900065, 1, 2026, 'Group Stage - 3', 'Group H', '2026-06-27 00:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Cape Verde',    NULL, NULL, 'Saudi Arabia', NULL, NULL, NULL, 'NRG Stadium', 'Houston'),
(900066, 1, 2026, 'Group Stage - 3', 'Group H', '2026-06-27 00:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Uruguay',       NULL, NULL, 'Spain',        NULL, NULL, NULL, 'Estadio Akron', 'Zapopan'),
(900067, 1, 2026, 'Group Stage - 3', 'Group L', '2026-06-27 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Panama',        NULL, NULL, 'England',      NULL, NULL, NULL, 'MetLife Stadium', 'East Rutherford'),
(900068, 1, 2026, 'Group Stage - 3', 'Group L', '2026-06-27 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Croatia',       NULL, NULL, 'Ghana',        NULL, NULL, NULL, 'Lincoln Financial Field', 'Philadelphia'),
(900069, 1, 2026, 'Group Stage - 3', 'Group J', '2026-06-28 02:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Algeria',       NULL, NULL, 'Austria',      NULL, NULL, NULL, 'Arrowhead Stadium', 'Kansas City'),
(900070, 1, 2026, 'Group Stage - 3', 'Group J', '2026-06-28 02:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Jordan',        NULL, NULL, 'Argentina',    NULL, NULL, NULL, 'AT&T Stadium', 'Arlington'),
(900071, 1, 2026, 'Group Stage - 3', 'Group K', '2026-06-27 23:30:00+00', 'Not Started', 'NS', NULL, NULL, 'Colombia',      NULL, NULL, 'Portugal',     NULL, NULL, NULL, 'Hard Rock Stadium', 'Miami Gardens'),
(900072, 1, 2026, 'Group Stage - 3', 'Group K', '2026-06-27 23:30:00+00', 'Not Started', 'NS', NULL, NULL, 'FIFA 1',        NULL, NULL, 'Uzbekistan',   NULL, NULL, NULL, 'Mercedes-Benz Stadium', 'Atlanta'),

-- ====== ROUND OF 32 ======
(900073, 1, 2026, 'Round of 32', NULL, '2026-06-28 19:00:00+00', 'Not Started', 'NS', NULL, NULL, '2A',     NULL, NULL, '2B',       NULL, NULL, NULL, 'SoFi Stadium', 'Inglewood'),
(900074, 1, 2026, 'Round of 32', NULL, '2026-06-29 20:30:00+00', 'Not Started', 'NS', NULL, NULL, '1E',     NULL, NULL, '3ABCDF',   NULL, NULL, NULL, 'Gillette Stadium', 'Foxborough'),
(900075, 1, 2026, 'Round of 32', NULL, '2026-06-30 01:00:00+00', 'Not Started', 'NS', NULL, NULL, '1F',     NULL, NULL, '2C',       NULL, NULL, NULL, 'Estadio BBVA', 'Guadalupe'),
(900076, 1, 2026, 'Round of 32', NULL, '2026-06-29 17:00:00+00', 'Not Started', 'NS', NULL, NULL, '1C',     NULL, NULL, '2F',       NULL, NULL, NULL, 'NRG Stadium', 'Houston'),
(900077, 1, 2026, 'Round of 32', NULL, '2026-06-30 21:00:00+00', 'Not Started', 'NS', NULL, NULL, '1I',     NULL, NULL, '3CDFGH',   NULL, NULL, NULL, 'MetLife Stadium', 'East Rutherford'),
(900078, 1, 2026, 'Round of 32', NULL, '2026-06-30 18:00:00+00', 'Not Started', 'NS', NULL, NULL, '2E',     NULL, NULL, '2I',       NULL, NULL, NULL, 'AT&T Stadium', 'Arlington'),
(900079, 1, 2026, 'Round of 32', NULL, '2026-07-01 01:00:00+00', 'Not Started', 'NS', NULL, NULL, '1A',     NULL, NULL, '3CEFHI',   NULL, NULL, NULL, 'Estadio Azteca', 'Mexico City'),
(900080, 1, 2026, 'Round of 32', NULL, '2026-07-01 16:00:00+00', 'Not Started', 'NS', NULL, NULL, '1L',     NULL, NULL, '3EHIJK',   NULL, NULL, NULL, 'Mercedes-Benz Stadium', 'Atlanta'),
(900081, 1, 2026, 'Round of 32', NULL, '2026-07-02 00:00:00+00', 'Not Started', 'NS', NULL, NULL, '1D',     NULL, NULL, '3BEFIJ',   NULL, NULL, NULL, 'Levi''s Stadium', 'Santa Clara'),
(900082, 1, 2026, 'Round of 32', NULL, '2026-07-01 20:00:00+00', 'Not Started', 'NS', NULL, NULL, '1G',     NULL, NULL, '3AEHIJ',   NULL, NULL, NULL, 'Lumen Field', 'Seattle'),
(900083, 1, 2026, 'Round of 32', NULL, '2026-07-02 23:00:00+00', 'Not Started', 'NS', NULL, NULL, '2K',     NULL, NULL, '2L',       NULL, NULL, NULL, 'BMO Field', 'Toronto'),
(900084, 1, 2026, 'Round of 32', NULL, '2026-07-02 19:00:00+00', 'Not Started', 'NS', NULL, NULL, '1H',     NULL, NULL, '2J',       NULL, NULL, NULL, 'SoFi Stadium', 'Inglewood'),
(900085, 1, 2026, 'Round of 32', NULL, '2026-07-03 03:00:00+00', 'Not Started', 'NS', NULL, NULL, '2B',     NULL, NULL, '3EFGIJ',   NULL, NULL, NULL, 'BC Place', 'Vancouver'),
(900086, 1, 2026, 'Round of 32', NULL, '2026-07-03 22:00:00+00', 'Not Started', 'NS', NULL, NULL, '1J',     NULL, NULL, '2H',       NULL, NULL, NULL, 'Hard Rock Stadium', 'Miami Gardens'),
(900087, 1, 2026, 'Round of 32', NULL, '2026-07-04 01:30:00+00', 'Not Started', 'NS', NULL, NULL, '1K',     NULL, NULL, '3DEIJL',   NULL, NULL, NULL, 'Arrowhead Stadium', 'Kansas City'),
(900088, 1, 2026, 'Round of 32', NULL, '2026-07-03 18:00:00+00', 'Not Started', 'NS', NULL, NULL, '2D',     NULL, NULL, '2G',       NULL, NULL, NULL, 'AT&T Stadium', 'Arlington'),

-- ====== ROUND OF 16 ======
(900089, 1, 2026, 'Round of 16', NULL, '2026-07-04 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W74', NULL, NULL, 'W77', NULL, NULL, NULL, 'Lincoln Financial Field', 'Philadelphia'),
(900090, 1, 2026, 'Round of 16', NULL, '2026-07-04 17:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W73', NULL, NULL, 'W75', NULL, NULL, NULL, 'NRG Stadium', 'Houston'),
(900091, 1, 2026, 'Round of 16', NULL, '2026-07-05 20:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W76', NULL, NULL, 'W78', NULL, NULL, NULL, 'MetLife Stadium', 'East Rutherford'),
(900092, 1, 2026, 'Round of 16', NULL, '2026-07-06 00:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W79', NULL, NULL, 'W80', NULL, NULL, NULL, 'Estadio Azteca', 'Mexico City'),
(900093, 1, 2026, 'Round of 16', NULL, '2026-07-06 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W83', NULL, NULL, 'W84', NULL, NULL, NULL, 'AT&T Stadium', 'Arlington'),
(900094, 1, 2026, 'Round of 16', NULL, '2026-07-07 00:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W81', NULL, NULL, 'W82', NULL, NULL, NULL, 'Lumen Field', 'Seattle'),
(900095, 1, 2026, 'Round of 16', NULL, '2026-07-07 16:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W86', NULL, NULL, 'W88', NULL, NULL, NULL, 'Mercedes-Benz Stadium', 'Atlanta'),
(900096, 1, 2026, 'Round of 16', NULL, '2026-07-07 20:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W85', NULL, NULL, 'W87', NULL, NULL, NULL, 'BC Place', 'Vancouver'),

-- ====== QUARTERFINALS ======
(900097, 1, 2026, 'Quarter-finals', NULL, '2026-07-09 20:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W89', NULL, NULL, 'W90', NULL, NULL, NULL, 'Gillette Stadium', 'Foxborough'),
(900098, 1, 2026, 'Quarter-finals', NULL, '2026-07-10 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W93', NULL, NULL, 'W94', NULL, NULL, NULL, 'SoFi Stadium', 'Inglewood'),
(900099, 1, 2026, 'Quarter-finals', NULL, '2026-07-11 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W91', NULL, NULL, 'W92', NULL, NULL, NULL, 'Hard Rock Stadium', 'Miami Gardens'),
(900100, 1, 2026, 'Quarter-finals', NULL, '2026-07-12 01:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W95', NULL, NULL, 'W96', NULL, NULL, NULL, 'Arrowhead Stadium', 'Kansas City'),

-- ====== SEMIFINALS ======
(900101, 1, 2026, 'Semi-finals', NULL, '2026-07-14 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W97', NULL, NULL, 'W98', NULL, NULL, NULL, 'AT&T Stadium', 'Arlington'),
(900102, 1, 2026, 'Semi-finals', NULL, '2026-07-15 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W99', NULL, NULL, 'W100', NULL, NULL, NULL, 'Mercedes-Benz Stadium', 'Atlanta'),

-- ====== THIRD PLACE PLAYOFF ======
(900103, 1, 2026, '3rd Place Final', NULL, '2026-07-18 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'L101', NULL, NULL, 'L102', NULL, NULL, NULL, 'Hard Rock Stadium', 'Miami Gardens'),

-- ====== FINAL ======
(900104, 1, 2026, 'Final', NULL, '2026-07-19 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W101', NULL, NULL, 'W102', NULL, NULL, NULL, 'MetLife Stadium', 'East Rutherford')

ON CONFLICT (id) DO UPDATE SET
  round = EXCLUDED.round,
  group_label = EXCLUDED.group_label,
  kickoff_utc = EXCLUDED.kickoff_utc,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  venue = EXCLUDED.venue,
  city = EXCLUDED.city,
  updated_at = now();

-- Confirmation
SELECT
  COUNT(*) AS total_fixtures,
  COUNT(*) FILTER (WHERE group_label IS NOT NULL) AS group_stage_matches,
  COUNT(*) FILTER (WHERE round = 'Round of 32') AS round_of_32,
  COUNT(*) FILTER (WHERE round = 'Round of 16') AS round_of_16,
  COUNT(*) FILTER (WHERE round = 'Quarter-finals') AS quarterfinals,
  COUNT(*) FILTER (WHERE round = 'Semi-finals') AS semifinals,
  COUNT(*) FILTER (WHERE round = '3rd Place Final') AS third_place,
  COUNT(*) FILTER (WHERE round = 'Final') AS final
FROM public.fixtures
WHERE id BETWEEN 900001 AND 900104;
