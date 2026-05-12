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
  score: { fulltime: { home: number | null; away: number | null } };
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
  return {
    id: af.fixture.id,
    league_id: af.league.id,
    season: af.league.season,
    round: af.league.round,
    group_label: deriveGroupLabel(af.league.round),
    kickoff_utc: af.fixture.date,
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
    venue: af.fixture.venue.name,
    city: af.fixture.venue.city,
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
