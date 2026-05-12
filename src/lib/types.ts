export type Fixture = {
  id: number;
  league_id: number;
  season: number;
  round: string | null;
  group_label: string | null;
  kickoff_utc: string;
  status: string;
  status_short: string | null;
  minute: number | null;
  home_team_id: number | null;
  home_team: string;
  home_logo: string | null;
  away_team_id: number | null;
  away_team: string;
  away_logo: string | null;
  home_score: number | null;
  away_score: number | null;
  venue: string | null;
  city: string | null;
};

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  locale: string;
};

export type Pool = {
  id: string;
  code: string;
  name: string;
  owner_id: string;
  scoring: { exact: number; outcome: number; miss: number };
  is_public: boolean;
  created_at: string;
};

export type Pick = {
  id: string;
  user_id: string;
  pool_id: string;
  fixture_id: number;
  home_pick: number;
  away_pick: number;
  locked: boolean;
};

export type LeaderboardRow = {
  pool_id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  picks_made: number;
  points: number;
  exact_count: number;
};
