/**
 * API-Football adapter.
 * Docs: https://www.api-football.com/documentation-v3
 *
 * If you ever swap providers, just rewrite this file — the rest of the app
 * only consumes the normalized FixtureUpsert shape below.
 */

import type { Fixture } from "./types";

const BASE = "https://v3.football.api-sports.io";

export type FixtureUpsert = Omit<Fixture, never> & { updated_at?: string };

type AFFixture = {
  fixture: {
    id: number;
    date: string;
    status: { long: string; short: string; elapsed: number | null };
    venue: { name: string | null; city: string | null };
  };
  league: {
    id: number;
    season: number;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
  score: {
    fulltime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
};

function deriveGroupLabel(round: string | null): string | null {
  if (!round) return null;
  // API-Football typically returns "Group Stage - 1", "1st Round", or for groups it includes "Group A" etc.
  const m = round.match(/Group\s+([A-L])/i);
  if (m) return `Group ${m[1].toUpperCase()}`;
  return null;
}

export function normalize(af: AFFixture): FixtureUpsert {
  const status = af.fixture.status.short;
  const groupLabel = deriveGroupLabel(af.league.round);
  const isKnockout = groupLabel === null && af.league.round !== null;

  // Ensure kickoff_utc is always in proper ISO UTC format
  // API-Football returns date in ISO format but may have offset issues
  let kickoffUtc = af.fixture.date;
  try {
    const date = new Date(af.fixture.date);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date from API: ${af.fixture.date}`);
    } else {
      // API-Football appears to be 1 hour ahead for World Cup 2026
      // Correct by subtracting 1 hour
      const correctedDate = new Date(date.getTime() - (1 * 60 * 60 * 1000));
      kickoffUtc = correctedDate.toISOString();
      console.log(`Fixture ${af.fixture.id}: Original ${date.toISOString()} → Corrected ${kickoffUtc}`);
    }
  } catch (e) {
    console.warn(`Failed to parse date: ${af.fixture.date}`, e);
  }

  return {
    id: af.fixture.id,
    league_id: af.league.id,
    season: af.league.season,
    round: af.league.round,
    group_label: groupLabel,
    kickoff_utc: kickoffUtc,
    status: af.fixture.status.long,
    status_short: status,
    minute: af.fixture.status.elapsed,
    home_team_id: af.teams.home.id,
    home_team: af.teams.home.name,
    home_logo: af.teams.home.logo,
    away_team_id: af.teams.away.id,
    away_team: af.teams.away.name,
    away_logo: af.teams.away.logo,
    home_score: af.goals.home,
    away_score: af.goals.away,
    home_penalty: af.score?.penalty?.home ?? null,
    away_penalty: af.score?.penalty?.away ?? null,
    venue: af.fixture.venue.name,
    city: af.fixture.venue.city,
    match_id: null,
    qualified_team_home: null,
    qualified_team_away: null,
    is_knockout: isKnockout,
  };
}

export async function fetchAllFixtures(): Promise<FixtureUpsert[]> {
  const key = process.env.API_FOOTBALL_KEY;
  const league = process.env.API_FOOTBALL_LEAGUE_ID ?? "1";
  const season = process.env.API_FOOTBALL_SEASON ?? "2026";
  if (!key) throw new Error("API_FOOTBALL_KEY not set");

  const res = await fetch(`${BASE}/fixtures?league=${league}&season=${season}`, {
    headers: { "x-apisports-key": key },
    // Cache on the CDN edge for 60s so we don't hammer the API quota.
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`API-Football ${res.status}`);
  const json = await res.json();
  if (!json.response) return [];
  return json.response.map(normalize);
}

/** Fetch only currently-live fixtures (cheap call — use frequently). */
export async function fetchLiveFixtures(): Promise<FixtureUpsert[]> {
  const key = process.env.API_FOOTBALL_KEY;
  const league = process.env.API_FOOTBALL_LEAGUE_ID ?? "1";
  if (!key) throw new Error("API_FOOTBALL_KEY not set");

  const res = await fetch(`${BASE}/fixtures?live=all&league=${league}`, {
    headers: { "x-apisports-key": key },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API-Football live ${res.status}`);
  const json = await res.json();
  return (json.response ?? []).map(normalize);
}

/**
 * Fetch squad (players) for a team from API-Football.
 *
 * Response shape:
 * {
 *   "team": { "id": 1, "name": "Argentina", "logo": "..." },
 *   "players": [
 *     {
 *       "id": 1,
 *       "name": "Player Name",
 *       "number": 10,
 *       "position": "Midfielder",
 *       "photo": "https://..."
 *     }
 *   ]
 * }
 */
export async function fetchTeamSquad(teamId: number): Promise<{
  team: { id: number; name: string; logo: string };
  players: Array<{
    id: number;
    name: string;
    number: number | null;
    position: string;
    photo: string | null;
  }>;
} | null> {
  const key = process.env.API_FOOTBALL_KEY;
  const season = process.env.API_FOOTBALL_SEASON ?? "2026";
  if (!key) throw new Error("API_FOOTBALL_KEY not set");

  const res = await fetch(
    `${BASE}/players/squads?team=${teamId}&season=${season}`,
    {
      headers: { "x-apisports-key": key },
      next: { revalidate: 3600 }, // Cache for 1 hour; squads change rarely
    }
  );
  if (!res.ok) {
    console.error(`API-Football squad fetch failed for team ${teamId}: ${res.status}`);
    return null;
  }
  const json = await res.json();
  const response = json.response?.[0];
  if (!response) return null;

  return {
    team: response.team,
    players: (response.players ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      number: p.number ?? null,
      position: p.position ?? "Unknown",
      photo: p.photo ?? null,
    })),
  };
}
