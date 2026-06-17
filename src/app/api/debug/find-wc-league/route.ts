import { NextResponse } from "next/server";

/**
 * Test endpoint to find the correct World Cup 2026 league ID
 * Tries common World Cup IDs to find which one returns fixtures
 */
export async function GET(req: Request) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return NextResponse.json({ error: "API key not set" }, { status: 400 });

  const season = "2026";
  const leagueIdsToTry = [1, 45, 529, 12, 2, 82]; // Common IDs for international tournaments

  const results: any[] = [];

  for (const leagueId of leagueIdsToTry) {
    try {
      const res = await fetch(
        `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}&limit=5`,
        {
          headers: { "x-apisports-key": key },
        }
      );
      const json = await res.json();
      const count = json.response?.length ?? 0;

      results.push({
        leagueId,
        fixturesFound: count,
        leagueName: json.response?.[0]?.league?.name ?? "Unknown",
        sampleFixture: count > 0 ? {
          teams: `${json.response[0].teams.home.name} vs ${json.response[0].teams.away.name}`,
          date: json.response[0].fixture.date,
        } : null,
      });
    } catch (err: any) {
      results.push({
        leagueId,
        error: err.message,
      });
    }
  }

  return NextResponse.json({
    message: "Tested common league IDs. Look for one with fixturesFound > 0",
    results,
    instructions: "Once you find the correct league ID above, update API_FOOTBALL_LEAGUE_ID in your .env.local or Vercel dashboard",
  });
}
