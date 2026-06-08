import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/matches/friendlies?from=2026-06-03&to=2026-06-10
 * Fetch international friendly matches within a date range.
 * Used to show national team preparation before major tournaments.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("from") || "2026-06-03";
    const toDate = searchParams.get("to") || "2026-06-10";

    const BASE = "https://v3.football.api-sports.io";
    const key = process.env.API_FOOTBALL_KEY;

    if (!key) {
      console.error("API_FOOTBALL_KEY not configured");
      return NextResponse.json(
        { matches: [], from: fromDate, to: toDate, count: 0 },
        { status: 200 }
      );
    }

    // Fetch matches for the date range (all leagues)
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
      return NextResponse.json(
        { matches: [], from: fromDate, to: toDate, count: 0 },
        { status: 200 }
      );
    }

    // Get all matches in the date range
    // (includes international friendlies, qualifiers, and any national team matches)
    const matches = json.response || [];

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
      league: m.league?.name || "International Friendly",
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
    console.error("Friendlies API error:", err.message);
    return NextResponse.json(
      { matches: [], count: 0 },
      { status: 200 }
    );
  }
}
