import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/matches/today
 * Fetch all soccer matches happening today from API-Football.
 * This includes World Cup, domestic leagues, club matches, etc.
 * Used for testing API-Football integration and cron job functionality.
 */
export async function GET(request: NextRequest) {
  try {
    const BASE = "https://v3.football.api-sports.io";
    const key = process.env.API_FOOTBALL_KEY;

    if (!key) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Get today's date in YYYY-MM-DD format (UTC)
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Fetch all matches for today (all leagues, all teams)
    const res = await fetch(`${BASE}/fixtures?date=${today}`, {
      headers: { "x-apisports-key": key },
      // Don't cache: we want fresh data for testing
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`API-Football error: ${res.status}`);
      return NextResponse.json(
        { error: "Failed to fetch matches from API-Football" },
        { status: res.status }
      );
    }

    const json = await res.json();
    const matches = json.response ?? [];

    // Transform API response to a simpler format
    const transformed = matches.map((m: any) => ({
      id: m.fixture.id,
      status: m.fixture.status.short,
      statusLong: m.fixture.status.long,
      kickoff: m.fixture.date,
      minute: m.fixture.status.elapsed,
      homeTeam: m.teams.home.name,
      awayTeam: m.teams.away.name,
      homeScore: m.goals.home,
      awayScore: m.goals.away,
      league: m.league.name,
      leagueId: m.league.id,
      season: m.league.season,
      round: m.league.round,
      venue: m.fixture.venue?.name || "TBD",
      country: m.fixture.venue?.city || "TBD",
    }));

    return NextResponse.json({
      date: today,
      count: transformed.length,
      matches: transformed.sort((a: any, b: any) =>
        new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      ),
    });
  } catch (err: any) {
    console.error("Matches API error:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
