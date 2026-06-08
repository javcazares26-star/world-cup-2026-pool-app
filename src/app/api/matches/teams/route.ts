import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/matches/teams?days=15
 * Fetch recent matches for major national soccer teams.
 * Shows recent form and match results from the past N days.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "15", 10);

    // Major national teams to monitor
    const TEAMS = ["Spain", "Argentina", "France", "Portugal", "Mexico", "USA", "Germany", "Brazil", "Netherlands", "Belgium"];

    const BASE = "https://v3.football.api-sports.io";
    const key = process.env.API_FOOTBALL_KEY;

    if (!key) {
      console.error("API_FOOTBALL_KEY not configured");
      return NextResponse.json(
        { matches: [], days, count: 0 },
        { status: 200 }
      );
    }

    // Calculate date range (past N days)
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const from = fromDate.toISOString().split("T")[0];
    const to = toDate.toISOString().split("T")[0];

    // Fetch all matches in the date range
    const res = await fetch(
      `${BASE}/fixtures?dateFrom=${from}&dateTo=${to}`,
      {
        headers: { "x-apisports-key": key },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.error(`API-Football returned ${res.status}: ${res.statusText}`);
      return NextResponse.json(
        { matches: [], days, count: 0 },
        { status: 200 }
      );
    }

    const json = await res.json();
    if (!json || !json.response || !Array.isArray(json.response)) {
      return NextResponse.json(
        { matches: [], days, count: 0 },
        { status: 200 }
      );
    }

    // Filter for matches involving our target teams
    const matches = json.response.filter((m: any) => {
      const homeTeam = m.teams?.home?.name || "";
      const awayTeam = m.teams?.away?.name || "";
      return TEAMS.includes(homeTeam) || TEAMS.includes(awayTeam);
    });

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
      from,
      to,
      days,
      count: transformed.length,
      teams: TEAMS,
      matches: transformed.sort((a: any, b: any) =>
        new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
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
