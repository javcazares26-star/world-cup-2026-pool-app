import { NextRequest, NextResponse } from "next/server";
import { fetchTeamSquad } from "@/lib/api-football";

/**
 * GET /api/teams/squad?teamId=1
 * Fetch squad data for a team from API-Football.
 * This endpoint wraps the API-Football call to avoid exposing the API key to the client.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamIdStr = searchParams.get("teamId");

    if (!teamIdStr || !/^\d+$/.test(teamIdStr)) {
      console.warn("Squad API: Missing or invalid teamId:", teamIdStr);
      return NextResponse.json(
        { error: "Missing or invalid teamId", team: null, players: [] },
        { status: 200 }
      );
    }

    const teamId = parseInt(teamIdStr, 10);
    console.log("Squad API: Fetching squad for teamId:", teamId);

    const squad = await fetchTeamSquad(teamId);

    if (!squad) {
      console.warn("Squad API: No squad data found for teamId:", teamId);
      return NextResponse.json(
        { error: "Squad data not found", team: null, players: [] },
        { status: 200 }
      );
    }

    console.log(`Squad API: Found ${squad.players?.length || 0} players for team ${squad.team?.name}`);
    return NextResponse.json(squad);
  } catch (err: any) {
    console.error("Squad API error:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch squad data", team: null, players: [] },
      { status: 200 }
    );
  }
}
