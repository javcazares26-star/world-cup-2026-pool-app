-- FIFA World Cup 2026 - Update Latest Match Scores
-- Source: Google FIFA WC matches (as of June 19, 2026)
-- All matches below are marked as FT (Finished)

-- Group A - Mexico 1 - South Korea 0
UPDATE fixtures
SET home_score = 1, away_score = 0, status_short = 'FT'
WHERE home_team = 'Mexico' AND away_team = 'South Korea';

-- Group A - Czechia 1 - South Africa 1
UPDATE fixtures
SET home_score = 1, away_score = 1, status_short = 'FT'
WHERE home_team = 'Czechia' AND away_team = 'South Africa';

-- Group B - Canada 6 - Qatar 0
UPDATE fixtures
SET home_score = 6, away_score = 0, status_short = 'FT'
WHERE home_team = 'Canada' AND away_team = 'Qatar';

-- Group B - Switzerland 4 - Bosnia and Herzegovina 1
UPDATE fixtures
SET home_score = 4, away_score = 1, status_short = 'FT'
WHERE home_team = 'Switzerland' AND away_team = 'Bosnia and Herzegovina';

-- Group L - Ghana 1 - Panama 0
UPDATE fixtures
SET home_score = 1, away_score = 0, status_short = 'FT'
WHERE home_team = 'Ghana' AND away_team = 'Panama';

-- Group K - Uzbekistan 1 - Colombia 3
UPDATE fixtures
SET home_score = 1, away_score = 3, status_short = 'FT'
WHERE home_team = 'Uzbekistan' AND away_team = 'Colombia';

-- Group D - USA 2 - Australia 0
UPDATE fixtures
SET home_score = 2, away_score = 0, status_short = 'FT'
WHERE home_team = 'USA' AND away_team = 'Australia';
