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
      return NextResponse.json(
        { error: "Missing or invalid teamId" },
        { status: 400 }
      );
    }

    const teamId = parseInt(teamIdStr, 10);
    const squad = await fetchTeamSquad(teamId);

    if (!squad) {
      return NextResponse.json(
        { error: "Squad data not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(squad);
  } catch (err: any) {
    console.error("Squad API error:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch squad data" },
      { status: 500 }
    );
  }
}
