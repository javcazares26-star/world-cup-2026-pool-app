import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Debug endpoint to check fixture data in database
 * Usage: GET /api/debug/fixtures?limit=10
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = url.searchParams.get("limit") ?? "20";

  try {
    const supabase = createAdminClient();

    // Get fixtures with and without scores
    const { data: allFixtures, error: allError } = await supabase
      .from("fixtures")
      .select("id, home_team, away_team, home_score, away_score, status_short, kickoff_utc")
      .order("kickoff_utc", { ascending: false })
      .limit(parseInt(limit));

    if (allError) throw allError;

    const withScores = (allFixtures || []).filter(
      (f: any) => f.home_score !== null && f.away_score !== null
    );
    const withoutScores = (allFixtures || []).filter(
      (f: any) => f.home_score === null || f.away_score === null
    );

    // Get stats
    const { count: totalCount } = await supabase
      .from("fixtures")
      .select("id", { count: "exact", head: true });

    const { count: scoreCount } = await supabase
      .from("fixtures")
      .select("id", { count: "exact", head: true })
      .not("home_score", "is", null);

    return NextResponse.json({
      summary: {
        totalFixtures: totalCount,
        fixturesWithScores: scoreCount,
        fixturesWithoutScores: totalCount! - scoreCount!,
        scorePercentage: `${Math.round(((scoreCount ?? 0) / (totalCount ?? 1)) * 100)}%`,
      },
      sampleData: {
        withScores: withScores.slice(0, 5),
        withoutScores: withoutScores.slice(0, 5),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Debug Fixtures]", err);
    return NextResponse.json(
      { error: err.message ?? "debug failed" },
      { status: 500 }
    );
  }
}
