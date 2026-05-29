import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Cron endpoint to automatically award tournament winner points
 *
 * Call this endpoint daily starting July 15, 2026
 * It will:
 * 1. Check if the Final match has been played (status = "FT", "AET", or "PEN")
 * 2. Identify the winning team
 * 3. Award 5 points to all users who predicted that team correctly
 *
 * Usage:
 * GET /api/cron/award-tournament-winner?secret=YOUR_CRON_SECRET
 *
 * Set up external cron (cron-job.org is free):
 * - URL: https://mundial2026-aesthion.vercel.app/api/cron/award-tournament-winner?secret=YOUR_SECRET
 * - Schedule: Daily at 12:00 UTC starting July 15, 2026
 */

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const supabase = createClient();

    // Find the Final match (highest round, latest date)
    const { data: finalMatch, error: finalError } = await supabase
      .from("fixtures")
      .select("*")
      .or("round.eq.Final,round.eq.3RD PLACE FINAL")
      .order("kickoff_utc", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (finalError) {
      return NextResponse.json(
        { error: "Failed to fetch final match", details: finalError },
        { status: 500 }
      );
    }

    if (!finalMatch) {
      return NextResponse.json({
        status: "pending",
        message: "Final match not found yet",
      });
    }

    // Check if Final has been played
    const isFinished =
      finalMatch.status_short === "FT" ||
      finalMatch.status_short === "AET" ||
      finalMatch.status_short === "PEN";

    if (!isFinished) {
      return NextResponse.json({
        status: "pending",
        message: `Final match is ${finalMatch.status_short}, waiting for completion`,
        match: {
          teams: `${finalMatch.home_team} vs ${finalMatch.away_team}`,
          status: finalMatch.status_short,
          score: `${finalMatch.home_score}-${finalMatch.away_score}`,
        },
      });
    }

    // Determine winning team
    const winningTeam =
      (finalMatch.home_score ?? 0) > (finalMatch.away_score ?? 0)
        ? finalMatch.home_team
        : finalMatch.away_team;

    if (!winningTeam) {
      return NextResponse.json(
        { error: "Could not determine winning team" },
        { status: 500 }
      );
    }

    // Award points to all pools (in case multiple pools have the same team pick)
    const { data: awardedPicks, error: awardError } = await supabase
      .from("tournament_winner_picks")
      .update({
        points_awarded: 5,
        updated_at: new Date().toISOString(),
      })
      .eq("team_name", winningTeam)
      .eq("points_awarded", 0) // Only award once (skip if already awarded)
      .select("pool_id, user_id");

    if (awardError) {
      return NextResponse.json(
        { error: "Failed to award points", details: awardError },
        { status: 500 }
      );
    }

    const awardCount = awardedPicks?.length ?? 0;

    // Log success
    console.log(`[Tournament Winner Award] ${awardCount} users awarded 5 points for picking ${winningTeam}`);

    return NextResponse.json({
      status: "success",
      message: `Points awarded to ${awardCount} users`,
      winningTeam,
      finalScore: `${finalMatch.home_team} ${finalMatch.home_score} - ${finalMatch.away_score} ${finalMatch.away_team}`,
      usersAwarded: awardCount,
    });
  } catch (error) {
    console.error("[Tournament Winner Award] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
