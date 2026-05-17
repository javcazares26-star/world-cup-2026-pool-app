-- =========================================================================
-- 2026 FIFA WORLD CUP — Real Fixtures v2 (latest qualified teams)
-- Source: WCup_2026_4.2.5_en.xlsx (official-format spreadsheet)
-- All UEFA/FIFA playoff winners now resolved to actual teams.
--
-- Updates from v1:
--   * UEFA D → Czech Rep.
--   * UEFA A → Bosnia/Herzeg.
--   * UEFA B → Sweden
--   * UEFA C → Turkey
--   * FIFA 1 → DR Congo
--   * FIFA 2 → Iraq
--   * South Korea → Rep. of Korea
--   * Iran → IR Iran
--   * Venues: host city names (e.g. "Mexico City", "Los Angeles")
--
-- Run in Supabase SQL Editor: paste, click Run.
-- Idempotent.
-- =========================================================================

-- Wipe old fixtures (v1 + test data)
DELETE FROM public.fixtures WHERE id BETWEEN 900001 AND 900104;

INSERT INTO public.fixtures (
  id, league_id, season, round, group_label, kickoff_utc,
  status, status_short, minute,
  home_team_id, home_team, home_logo,
  away_team_id, away_team, away_logo,
  home_score, away_score, venue, city
) VALUES
(900001, 1, 2026, 'Group Stage - 1', 'Group A', '2026-06-11 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Mexico', NULL, NULL, 'South Africa', NULL, NULL, NULL, 'Mexico City', 'Mexico City'),
(900002, 1, 2026, 'Group Stage - 1', 'Group A', '2026-06-12 04:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Rep. of Korea', NULL, NULL, 'Czech Rep.', NULL, NULL, NULL, 'Guadalajara', 'Guadalajara'),
(900003, 1, 2026, 'Group Stage - 1', 'Group B', '2026-06-12 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Canada', NULL, NULL, 'Bosnia/Herzeg.', NULL, NULL, NULL, 'Toronto', 'Toronto'),
(900004, 1, 2026, 'Group Stage - 1', 'Group D', '2026-06-13 03:00:00+00', 'Not Started', 'NS', NULL, NULL, 'USA', NULL, NULL, 'Paraguay', NULL, NULL, NULL, 'Los Angeles', 'Los Angeles'),
(900005, 1, 2026, 'Group Stage - 1', 'Group C', '2026-06-14 03:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Haiti', NULL, NULL, 'Scotland', NULL, NULL, NULL, 'Boston', 'Boston'),
(900006, 1, 2026, 'Group Stage - 1', 'Group D', '2026-06-14 06:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Australia', NULL, NULL, 'Turkey', NULL, NULL, NULL, 'Vancouver', 'Vancouver'),
(900007, 1, 2026, 'Group Stage - 1', 'Group C', '2026-06-14 00:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Brazil', NULL, NULL, 'Morocco', NULL, NULL, NULL, 'New York/New Jersey', 'New York/New Jersey'),
(900008, 1, 2026, 'Group Stage - 1', 'Group B', '2026-06-13 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Qatar', NULL, NULL, 'Switzerland', NULL, NULL, NULL, 'San Francisco Bay Area', 'San Francisco Bay Area'),
(900009, 1, 2026, 'Group Stage - 1', 'Group E', '2026-06-15 01:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Ivory Coast', NULL, NULL, 'Ecuador', NULL, NULL, NULL, 'Philadelphia', 'Philadelphia'),
(900010, 1, 2026, 'Group Stage - 1', 'Group E', '2026-06-14 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Germany', NULL, NULL, 'Curaçao', NULL, NULL, NULL, 'Houston', 'Houston'),
(900011, 1, 2026, 'Group Stage - 1', 'Group F', '2026-06-14 22:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Netherlands', NULL, NULL, 'Japan', NULL, NULL, NULL, 'Dallas', 'Dallas'),
(900012, 1, 2026, 'Group Stage - 1', 'Group F', '2026-06-15 04:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Sweden', NULL, NULL, 'Tunisia', NULL, NULL, NULL, 'Monterrey', 'Monterrey'),
(900013, 1, 2026, 'Group Stage - 1', 'Group H', '2026-06-16 00:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Saudi Arabia', NULL, NULL, 'Uruguay', NULL, NULL, NULL, 'Miami', 'Miami'),
(900014, 1, 2026, 'Group Stage - 1', 'Group H', '2026-06-15 18:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Spain', NULL, NULL, 'Cape Verde', NULL, NULL, NULL, 'Atlanta', 'Atlanta'),
(900015, 1, 2026, 'Group Stage - 1', 'Group G', '2026-06-16 03:00:00+00', 'Not Started', 'NS', NULL, NULL, 'IR Iran', NULL, NULL, 'New Zealand', NULL, NULL, NULL, 'Los Angeles', 'Los Angeles'),
(900016, 1, 2026, 'Group Stage - 1', 'Group G', '2026-06-15 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Belgium', NULL, NULL, 'Egypt', NULL, NULL, NULL, 'Seattle', 'Seattle'),
(900017, 1, 2026, 'Group Stage - 1', 'Group I', '2026-06-16 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'France', NULL, NULL, 'Senegal', NULL, NULL, NULL, 'New York/New Jersey', 'New York/New Jersey'),
(900018, 1, 2026, 'Group Stage - 1', 'Group I', '2026-06-17 00:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Iraq', NULL, NULL, 'Norway', NULL, NULL, NULL, 'Boston', 'Boston'),
(900019, 1, 2026, 'Group Stage - 1', 'Group J', '2026-06-17 03:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Argentina', NULL, NULL, 'Algeria', NULL, NULL, NULL, 'Kansas City', 'Kansas City'),
(900020, 1, 2026, 'Group Stage - 1', 'Group J', '2026-06-17 06:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Austria', NULL, NULL, 'Jordan', NULL, NULL, NULL, 'San Francisco Bay Area', 'San Francisco Bay Area'),
(900021, 1, 2026, 'Group Stage - 1', 'Group L', '2026-06-18 01:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Ghana', NULL, NULL, 'Panama', NULL, NULL, NULL, 'Toronto', 'Toronto'),
(900022, 1, 2026, 'Group Stage - 1', 'Group L', '2026-06-17 22:00:00+00', 'Not Started', 'NS', NULL, NULL, 'England', NULL, NULL, 'Croatia', NULL, NULL, NULL, 'Dallas', 'Dallas'),
(900023, 1, 2026, 'Group Stage - 1', 'Group K', '2026-06-17 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Portugal', NULL, NULL, 'DR Congo', NULL, NULL, NULL, 'Houston', 'Houston'),
(900024, 1, 2026, 'Group Stage - 1', 'Group K', '2026-06-18 04:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Uzbekistan', NULL, NULL, 'Colombia', NULL, NULL, NULL, 'Mexico City', 'Mexico City'),
(900025, 1, 2026, 'Group Stage - 2', 'Group A', '2026-06-18 18:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Czech Rep.', NULL, NULL, 'South Africa', NULL, NULL, NULL, 'Atlanta', 'Atlanta'),
(900026, 1, 2026, 'Group Stage - 2', 'Group B', '2026-06-18 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Switzerland', NULL, NULL, 'Bosnia/Herzeg.', NULL, NULL, NULL, 'Los Angeles', 'Los Angeles'),
(900027, 1, 2026, 'Group Stage - 2', 'Group B', '2026-06-19 00:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Canada', NULL, NULL, 'Qatar', NULL, NULL, NULL, 'Vancouver', 'Vancouver'),
(900028, 1, 2026, 'Group Stage - 2', 'Group A', '2026-06-19 03:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Mexico', NULL, NULL, 'Rep. of Korea', NULL, NULL, NULL, 'Guadalajara', 'Guadalajara'),
(900029, 1, 2026, 'Group Stage - 2', 'Group C', '2026-06-20 02:30:00+00', 'Not Started', 'NS', NULL, NULL, 'Brazil', NULL, NULL, 'Haiti', NULL, NULL, NULL, 'Philadelphia', 'Philadelphia'),
(900030, 1, 2026, 'Group Stage - 2', 'Group C', '2026-06-20 00:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Scotland', NULL, NULL, 'Morocco', NULL, NULL, NULL, 'Boston', 'Boston'),
(900031, 1, 2026, 'Group Stage - 2', 'Group D', '2026-06-20 05:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Turkey', NULL, NULL, 'Paraguay', NULL, NULL, NULL, 'San Francisco Bay Area', 'San Francisco Bay Area'),
(900032, 1, 2026, 'Group Stage - 2', 'Group D', '2026-06-19 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'USA', NULL, NULL, 'Australia', NULL, NULL, NULL, 'Seattle', 'Seattle'),
(900033, 1, 2026, 'Group Stage - 2', 'Group E', '2026-06-20 22:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Germany', NULL, NULL, 'Ivory Coast', NULL, NULL, NULL, 'Toronto', 'Toronto'),
(900034, 1, 2026, 'Group Stage - 2', 'Group E', '2026-06-21 02:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Ecuador', NULL, NULL, 'Curaçao', NULL, NULL, NULL, 'Kansas City', 'Kansas City'),
(900035, 1, 2026, 'Group Stage - 2', 'Group F', '2026-06-20 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Netherlands', NULL, NULL, 'Sweden', NULL, NULL, NULL, 'Houston', 'Houston'),
(900036, 1, 2026, 'Group Stage - 2', 'Group F', '2026-06-21 06:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Tunisia', NULL, NULL, 'Japan', NULL, NULL, NULL, 'Monterrey', 'Monterrey'),
(900037, 1, 2026, 'Group Stage - 2', 'Group H', '2026-06-22 00:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Uruguay', NULL, NULL, 'Cape Verde', NULL, NULL, NULL, 'Miami', 'Miami'),
(900038, 1, 2026, 'Group Stage - 2', 'Group H', '2026-06-21 18:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Spain', NULL, NULL, 'Saudi Arabia', NULL, NULL, NULL, 'Atlanta', 'Atlanta'),
(900039, 1, 2026, 'Group Stage - 2', 'Group G', '2026-06-21 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Belgium', NULL, NULL, 'IR Iran', NULL, NULL, NULL, 'Los Angeles', 'Los Angeles'),
(900040, 1, 2026, 'Group Stage - 2', 'Group G', '2026-06-22 03:00:00+00', 'Not Started', 'NS', NULL, NULL, 'New Zealand', NULL, NULL, 'Egypt', NULL, NULL, NULL, 'Vancouver', 'Vancouver'),
(900041, 1, 2026, 'Group Stage - 2', 'Group I', '2026-06-23 02:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Norway', NULL, NULL, 'Senegal', NULL, NULL, NULL, 'New York/New Jersey', 'New York/New Jersey'),
(900042, 1, 2026, 'Group Stage - 2', 'Group I', '2026-06-22 23:00:00+00', 'Not Started', 'NS', NULL, NULL, 'France', NULL, NULL, 'Iraq', NULL, NULL, NULL, 'Philadelphia', 'Philadelphia'),
(900043, 1, 2026, 'Group Stage - 2', 'Group J', '2026-06-22 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Argentina', NULL, NULL, 'Austria', NULL, NULL, NULL, 'Dallas', 'Dallas'),
(900044, 1, 2026, 'Group Stage - 2', 'Group J', '2026-06-23 05:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Jordan', NULL, NULL, 'Algeria', NULL, NULL, NULL, 'San Francisco Bay Area', 'San Francisco Bay Area'),
(900045, 1, 2026, 'Group Stage - 2', 'Group L', '2026-06-23 22:00:00+00', 'Not Started', 'NS', NULL, NULL, 'England', NULL, NULL, 'Ghana', NULL, NULL, NULL, 'Boston', 'Boston'),
(900046, 1, 2026, 'Group Stage - 2', 'Group L', '2026-06-24 01:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Panama', NULL, NULL, 'Croatia', NULL, NULL, NULL, 'Toronto', 'Toronto'),
(900047, 1, 2026, 'Group Stage - 2', 'Group K', '2026-06-23 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Portugal', NULL, NULL, 'Uzbekistan', NULL, NULL, NULL, 'Houston', 'Houston'),
(900048, 1, 2026, 'Group Stage - 2', 'Group K', '2026-06-24 04:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Colombia', NULL, NULL, 'DR Congo', NULL, NULL, NULL, 'Guadalajara', 'Guadalajara'),
(900049, 1, 2026, 'Group Stage - 3', 'Group C', '2026-06-25 00:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Scotland', NULL, NULL, 'Brazil', NULL, NULL, NULL, 'Miami', 'Miami'),
(900050, 1, 2026, 'Group Stage - 3', 'Group C', '2026-06-25 00:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Morocco', NULL, NULL, 'Haiti', NULL, NULL, NULL, 'Atlanta', 'Atlanta'),
(900051, 1, 2026, 'Group Stage - 3', 'Group B', '2026-06-24 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Switzerland', NULL, NULL, 'Canada', NULL, NULL, NULL, 'Vancouver', 'Vancouver'),
(900052, 1, 2026, 'Group Stage - 3', 'Group B', '2026-06-24 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Bosnia/Herzeg.', NULL, NULL, 'Qatar', NULL, NULL, NULL, 'Seattle', 'Seattle'),
(900053, 1, 2026, 'Group Stage - 3', 'Group A', '2026-06-25 03:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Czech Rep.', NULL, NULL, 'Mexico', NULL, NULL, NULL, 'Mexico City', 'Mexico City'),
(900054, 1, 2026, 'Group Stage - 3', 'Group A', '2026-06-25 03:00:00+00', 'Not Started', 'NS', NULL, NULL, 'South Africa', NULL, NULL, 'Rep. of Korea', NULL, NULL, NULL, 'Monterrey', 'Monterrey'),
(900055, 1, 2026, 'Group Stage - 3', 'Group E', '2026-06-25 22:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Curaçao', NULL, NULL, 'Ivory Coast', NULL, NULL, NULL, 'Philadelphia', 'Philadelphia'),
(900056, 1, 2026, 'Group Stage - 3', 'Group E', '2026-06-25 22:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Ecuador', NULL, NULL, 'Germany', NULL, NULL, NULL, 'New York/New Jersey', 'New York/New Jersey'),
(900057, 1, 2026, 'Group Stage - 3', 'Group F', '2026-06-26 01:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Japan', NULL, NULL, 'Sweden', NULL, NULL, NULL, 'Dallas', 'Dallas'),
(900058, 1, 2026, 'Group Stage - 3', 'Group F', '2026-06-26 01:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Tunisia', NULL, NULL, 'Netherlands', NULL, NULL, NULL, 'Kansas City', 'Kansas City'),
(900059, 1, 2026, 'Group Stage - 3', 'Group D', '2026-06-26 04:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Turkey', NULL, NULL, 'USA', NULL, NULL, NULL, 'Los Angeles', 'Los Angeles'),
(900060, 1, 2026, 'Group Stage - 3', 'Group D', '2026-06-26 04:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Paraguay', NULL, NULL, 'Australia', NULL, NULL, NULL, 'San Francisco Bay Area', 'San Francisco Bay Area'),
(900061, 1, 2026, 'Group Stage - 3', 'Group I', '2026-06-26 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Norway', NULL, NULL, 'France', NULL, NULL, NULL, 'Boston', 'Boston'),
(900062, 1, 2026, 'Group Stage - 3', 'Group I', '2026-06-26 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Senegal', NULL, NULL, 'Iraq', NULL, NULL, NULL, 'Toronto', 'Toronto'),
(900063, 1, 2026, 'Group Stage - 3', 'Group G', '2026-06-27 05:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Egypt', NULL, NULL, 'IR Iran', NULL, NULL, NULL, 'Seattle', 'Seattle'),
(900064, 1, 2026, 'Group Stage - 3', 'Group G', '2026-06-27 05:00:00+00', 'Not Started', 'NS', NULL, NULL, 'New Zealand', NULL, NULL, 'Belgium', NULL, NULL, NULL, 'Vancouver', 'Vancouver'),
(900065, 1, 2026, 'Group Stage - 3', 'Group H', '2026-06-27 02:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Cape Verde', NULL, NULL, 'Saudi Arabia', NULL, NULL, NULL, 'Houston', 'Houston'),
(900066, 1, 2026, 'Group Stage - 3', 'Group H', '2026-06-27 02:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Uruguay', NULL, NULL, 'Spain', NULL, NULL, NULL, 'Guadalajara', 'Guadalajara'),
(900067, 1, 2026, 'Group Stage - 3', 'Group L', '2026-06-27 23:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Panama', NULL, NULL, 'England', NULL, NULL, NULL, 'New York/New Jersey', 'New York/New Jersey'),
(900068, 1, 2026, 'Group Stage - 3', 'Group L', '2026-06-27 23:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Croatia', NULL, NULL, 'Ghana', NULL, NULL, NULL, 'Philadelphia', 'Philadelphia'),
(900069, 1, 2026, 'Group Stage - 3', 'Group J', '2026-06-28 04:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Algeria', NULL, NULL, 'Austria', NULL, NULL, NULL, 'Kansas City', 'Kansas City'),
(900070, 1, 2026, 'Group Stage - 3', 'Group J', '2026-06-28 04:00:00+00', 'Not Started', 'NS', NULL, NULL, 'Jordan', NULL, NULL, 'Argentina', NULL, NULL, NULL, 'Dallas', 'Dallas'),
(900071, 1, 2026, 'Group Stage - 3', 'Group K', '2026-06-28 01:30:00+00', 'Not Started', 'NS', NULL, NULL, 'Colombia', NULL, NULL, 'Portugal', NULL, NULL, NULL, 'Miami', 'Miami'),
(900072, 1, 2026, 'Group Stage - 3', 'Group K', '2026-06-28 01:30:00+00', 'Not Started', 'NS', NULL, NULL, 'DR Congo', NULL, NULL, 'Uzbekistan', NULL, NULL, NULL, 'Atlanta', 'Atlanta'),
(900073, 1, 2026, 'Round of 32', NULL, '2026-06-28 21:00:00+00', 'Not Started', 'NS', NULL, NULL, '2A', NULL, NULL, '2B', NULL, NULL, NULL, 'Los Angeles', 'Los Angeles'),
(900074, 1, 2026, 'Round of 32', NULL, '2026-06-29 22:30:00+00', 'Not Started', 'NS', NULL, NULL, '1E', NULL, NULL, '3-ABCDF', NULL, NULL, NULL, 'Boston', 'Boston'),
(900075, 1, 2026, 'Round of 32', NULL, '2026-06-30 03:00:00+00', 'Not Started', 'NS', NULL, NULL, '1F', NULL, NULL, '2C', NULL, NULL, NULL, 'Monterrey', 'Monterrey'),
(900076, 1, 2026, 'Round of 32', NULL, '2026-06-29 19:00:00+00', 'Not Started', 'NS', NULL, NULL, '1C', NULL, NULL, '2F', NULL, NULL, NULL, 'Houston', 'Houston'),
(900077, 1, 2026, 'Round of 32', NULL, '2026-06-30 23:00:00+00', 'Not Started', 'NS', NULL, NULL, '1I', NULL, NULL, '3-CDFGH', NULL, NULL, NULL, 'New York/New Jersey', 'New York/New Jersey'),
(900078, 1, 2026, 'Round of 32', NULL, '2026-06-30 19:00:00+00', 'Not Started', 'NS', NULL, NULL, '2E', NULL, NULL, '2I', NULL, NULL, NULL, 'Dallas', 'Dallas'),
(900079, 1, 2026, 'Round of 32', NULL, '2026-07-01 03:00:00+00', 'Not Started', 'NS', NULL, NULL, '1A', NULL, NULL, '3-CEFHI', NULL, NULL, NULL, 'Mexico City', 'Mexico City'),
(900080, 1, 2026, 'Round of 32', NULL, '2026-07-01 18:00:00+00', 'Not Started', 'NS', NULL, NULL, '1L', NULL, NULL, '3-EHIJK', NULL, NULL, NULL, 'Atlanta', 'Atlanta'),
(900081, 1, 2026, 'Round of 32', NULL, '2026-07-02 02:00:00+00', 'Not Started', 'NS', NULL, NULL, '1D', NULL, NULL, '3-BEFIJ', NULL, NULL, NULL, 'San Francisco Bay Area', 'San Francisco Bay Area'),
(900082, 1, 2026, 'Round of 32', NULL, '2026-07-01 22:00:00+00', 'Not Started', 'NS', NULL, NULL, '1G', NULL, NULL, '3-AEHIJ', NULL, NULL, NULL, 'Seattle', 'Seattle'),
(900083, 1, 2026, 'Round of 32', NULL, '2026-07-03 01:00:00+00', 'Not Started', 'NS', NULL, NULL, '2K', NULL, NULL, '2L', NULL, NULL, NULL, 'Toronto', 'Toronto'),
(900084, 1, 2026, 'Round of 32', NULL, '2026-07-02 21:00:00+00', 'Not Started', 'NS', NULL, NULL, '1H', NULL, NULL, '2J', NULL, NULL, NULL, 'Los Angeles', 'Los Angeles'),
(900085, 1, 2026, 'Round of 32', NULL, '2026-07-03 05:00:00+00', 'Not Started', 'NS', NULL, NULL, '1B', NULL, NULL, '3-EFGIJ', NULL, NULL, NULL, 'Vancouver', 'Vancouver'),
(900086, 1, 2026, 'Round of 32', NULL, '2026-07-04 00:00:00+00', 'Not Started', 'NS', NULL, NULL, '1J', NULL, NULL, '2H', NULL, NULL, NULL, 'Miami', 'Miami'),
(900087, 1, 2026, 'Round of 32', NULL, '2026-07-04 03:30:00+00', 'Not Started', 'NS', NULL, NULL, '1K', NULL, NULL, '3-DEIJL', NULL, NULL, NULL, 'Kansas City', 'Kansas City'),
(900088, 1, 2026, 'Round of 32', NULL, '2026-07-03 20:00:00+00', 'Not Started', 'NS', NULL, NULL, '2D', NULL, NULL, '2G', NULL, NULL, NULL, 'Dallas', 'Dallas'),
(900089, 1, 2026, 'Round of 16', NULL, '2026-07-04 23:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W74', NULL, NULL, 'W77', NULL, NULL, NULL, 'Philadelphia', 'Philadelphia'),
(900090, 1, 2026, 'Round of 16', NULL, '2026-07-04 19:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W73', NULL, NULL, 'W75', NULL, NULL, NULL, 'Houston', 'Houston'),
(900091, 1, 2026, 'Round of 16', NULL, '2026-07-05 22:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W76', NULL, NULL, 'W78', NULL, NULL, NULL, 'New York/New Jersey', 'New York/New Jersey'),
(900092, 1, 2026, 'Round of 16', NULL, '2026-07-06 02:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W79', NULL, NULL, 'W80', NULL, NULL, NULL, 'Mexico City', 'Mexico City'),
(900093, 1, 2026, 'Round of 16', NULL, '2026-07-06 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W83', NULL, NULL, 'W84', NULL, NULL, NULL, 'Dallas', 'Dallas'),
(900094, 1, 2026, 'Round of 16', NULL, '2026-07-07 02:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W81', NULL, NULL, 'W82', NULL, NULL, NULL, 'Seattle', 'Seattle'),
(900095, 1, 2026, 'Round of 16', NULL, '2026-07-07 18:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W86', NULL, NULL, 'W88', NULL, NULL, NULL, 'Atlanta', 'Atlanta'),
(900096, 1, 2026, 'Round of 16', NULL, '2026-07-07 22:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W85', NULL, NULL, 'W87', NULL, NULL, NULL, 'Vancouver', 'Vancouver'),
(900097, 1, 2026, 'Quarter-finals', NULL, '2026-07-09 22:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W89', NULL, NULL, 'W90', NULL, NULL, NULL, 'Boston', 'Boston'),
(900098, 1, 2026, 'Quarter-finals', NULL, '2026-07-10 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W93', NULL, NULL, 'W94', NULL, NULL, NULL, 'Los Angeles', 'Los Angeles'),
(900099, 1, 2026, 'Quarter-finals', NULL, '2026-07-11 23:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W91', NULL, NULL, 'W92', NULL, NULL, NULL, 'Miami', 'Miami'),
(900100, 1, 2026, 'Quarter-finals', NULL, '2026-07-12 03:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W95', NULL, NULL, 'W96', NULL, NULL, NULL, 'Kansas City', 'Kansas City'),
(900101, 1, 2026, 'Semi-finals', NULL, '2026-07-14 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W97', NULL, NULL, 'W98', NULL, NULL, NULL, 'Dallas', 'Dallas'),
(900102, 1, 2026, 'Semi-finals', NULL, '2026-07-15 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W99', NULL, NULL, 'W100', NULL, NULL, NULL, 'Atlanta', 'Atlanta'),
(900103, 1, 2026, '3rd Place Final', NULL, '2026-07-18 23:00:00+00', 'Not Started', 'NS', NULL, NULL, 'RU101', NULL, NULL, 'RU102', NULL, NULL, NULL, 'Miami', 'Miami'),
(900104, 1, 2026, 'Final', NULL, '2026-07-19 21:00:00+00', 'Not Started', 'NS', NULL, NULL, 'W101', NULL, NULL, 'W102', NULL, NULL, NULL, 'New York/New Jersey', 'New York/New Jersey')
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
  COUNT(*) FILTER (WHERE group_label IS NOT NULL) AS group_matches,
  COUNT(DISTINCT group_label) FILTER (WHERE group_label IS NOT NULL) AS groups
FROM public.fixtures
WHERE id BETWEEN 900001 AND 900104;
