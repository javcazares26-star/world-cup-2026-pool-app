import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/matches/teams?days=15
 * Fetch recent matches for major national soccer teams.
 * Shows recent form and match results from the past N days.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    const BASE = "https://v3.football.api-sports.io";
    const key = process.env.API_FOOTBALL_KEY;

    if (!key) {
      console.error("API_FOOTBALL_KEY not configured");
      return NextResponse.json(
        { matches: [], from: fromDate, to: toDate, count: 0 },
        { status: 200 }
      );
    }

    if (!fromDate || !toDate) {
      console.error("Missing from or to date");
      return NextResponse.json(
        { matches: [], from: fromDate, to: toDate, count: 0 },
        { status: 200 }
      );
    }

    console.log(`Fetching all matches from ${fromDate} to ${toDate}`);

    // Fetch ALL matches in the date range (no team filter)
    const res = await fetch(
      `${BASE}/fixtures?dateFrom=${fromDate}&dateTo=${toDate}`,
      {
        headers: { "x-apisports-key": key },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.error(`API-Football returned ${res.status}: ${res.statusText}`);
      return NextResponse.json(
        { matches: [], from: fromDate, to: toDate, count: 0 },
        { status: 200 }
      );
    }

    const json = await res.json();
    if (!json || !json.response || !Array.isArray(json.response)) {
      console.warn("No matches found in API response");
      return NextResponse.json(
        { matches: [], from: fromDate, to: toDate, count: 0 },
        { status: 200 }
      );
    }

    // Get all matches (no filtering)
    const matches = json.response || [];
    console.log(`Found ${matches.length} total matches`);

    // Transform to simpler format
    const transformed = matches.map((m: any) => ({
      id: m.fixture?.id || 0,
      status: m.fixture?.status?.short || "TBD",
      statusLong: m.fixture?.status?.long || "TBD",
      kickoff: m.fixture?.date || new Date().toISOString(),
      minute: m.fixture?.status?.elapsed || null,
      homeTeam: m.teams?.home?.name || "Unknown",
      awayTeam: m.teams?.away?.name || "Unknown",
      homeScore: m.goals?.home ?? null,
      awayScore: m.goals?.away ?? null,
      league: m.league?.name || "International",
      leagueId: m.league?.id || 0,
      season: m.league?.season || 0,
      round: m.league?.round || null,
      venue: m.fixture?.venue?.name || "TBD",
      country: m.fixture?.venue?.city || "TBD",
    }));

    return NextResponse.json({
      from: fromDate,
      to: toDate,
      count: transformed.length,
      matches: transformed.sort((a: any, b: any) =>
        new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      ),
    });
  } catch (err: any) {
    console.error("Teams API error:", err.message);
    return NextResponse.json(
      { matches: [], count: 0 },
      { status: 200 }
    );
  }
}
