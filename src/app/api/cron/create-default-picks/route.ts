import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Cron endpoint to create default 0-0 picks for members who missed picking
 *
 * Runs every 10 minutes to:
 * 1. Find all finished matches (status_short = 'FT')
 * 2. For each pool, find all members
 * 3. Create default 0-0 picks for any member who didn't make a pick on finished matches
 * 4. This ensures no member has an unfair advantage from skipping picks
 *
 * Usage:
 * GET /api/cron/create-default-picks?secret=YOUR_CRON_SECRET
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const headerSecret = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const querySecret = url.searchParams.get("secret");
  const ok = (headerSecret && headerSecret === process.env.CRON_SECRET)
    || (querySecret && querySecret === process.env.CRON_SECRET)
    || (req.headers.get("user-agent")?.includes("vercel-cron"));
  if (!ok) return unauthorized();

  try {
    const supabase = createAdminClient();
    let createdCount = 0;
    let skippedCount = 0;

    // Get all finished matches
    const { data: finishedMatches, error: matchError } = await supabase
      .from("fixtures")
      .select("id")
      .eq("status_short", "FT");

    if (matchError) throw matchError;
    if (!finishedMatches || finishedMatches.length === 0) {
      return NextResponse.json({ ok: true, message: "No finished matches yet", created: 0 });
    }

    const finishedFixtureIds = finishedMatches.map((m) => m.id);

    // Get all pools with members
    const { data: pools, error: poolError } = await supabase
      .from("pools")
      .select("id");

    if (poolError) throw poolError;
    if (!pools) return NextResponse.json({ ok: true, created: 0 });

    // For each pool
    for (const pool of pools) {
      // Get all members in the pool
      const { data: members, error: memberError } = await supabase
        .from("pool_members")
        .select("user_id")
        .eq("pool_id", pool.id);

      if (memberError) {
        console.error(`Error fetching members for pool ${pool.id}:`, memberError);
        continue;
      }

      if (!members) continue;

      // For each finished match
      for (const fixtureId of finishedFixtureIds) {
        // For each member, check if they have a pick on this match
        for (const member of members) {
          const { data: existingPick, error: pickError } = await supabase
            .from("picks")
            .select("id")
            .eq("fixture_id", fixtureId)
            .eq("user_id", member.user_id)
            .eq("pool_id", pool.id)
            .maybeSingle();

          if (pickError) {
            console.error(`Error checking pick for user ${member.user_id} on fixture ${fixtureId}:`, pickError);
            continue;
          }

          // If no pick exists, create a default 0-0 pick
          if (!existingPick) {
            const { error: insertError } = await supabase
              .from("picks")
              .insert({
                fixture_id: fixtureId,
                user_id: member.user_id,
                pool_id: pool.id,
                home_pick: 0,
                away_pick: 0,
                locked: true, // Automatically lock it since the match is finished
              });

            if (insertError) {
              console.error(`Error creating default pick for user ${member.user_id}:`, insertError);
              skippedCount++;
            } else {
              createdCount++;
            }
          }
        }
      }
    }

    console.log(`[Create Default Picks] Created: ${createdCount}, Skipped: ${skippedCount}`);

    return NextResponse.json({
      ok: true,
      created: createdCount,
      skipped: skippedCount,
      message: `Created ${createdCount} default 0-0 picks for missed matches`,
    });
  } catch (err: any) {
    console.error("[Create Default Picks] Error:", err);
    return NextResponse.json({ error: err.message ?? "failed to create default picks" }, { status: 500 });
  }
}
