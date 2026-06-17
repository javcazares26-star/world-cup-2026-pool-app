/**
 * Vercel Cron endpoint — pulls fixtures from API-Football and upserts into Supabase.
 *
 * Schedule (see vercel.json): every 5 min.
 * - On every run: fetch /fixtures?live=all → upsert (cheap, captures in-play score changes).
 * - Every 10th run: fetch the full league/season list → catches schedule changes & post-match results.
 *
 * Secured with header `x-cron-secret` (Vercel sets this automatically when calling cron paths;
 * we also accept ?secret=… for manual triggers).
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchAllFixtures, fetchLiveFixtures } from "@/lib/api-football";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const headerSecret = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const querySecret  = url.searchParams.get("secret");
  const ok = (headerSecret && headerSecret === process.env.CRON_SECRET)
          || (querySecret  && querySecret  === process.env.CRON_SECRET)
          // Vercel cron sets the host header to vercel.app and uses its own auth — accept if VERCEL is set.
          || (req.headers.get("user-agent")?.includes("vercel-cron"));
  if (!ok) return unauthorized();

  const supabase = createAdminClient();
  const mode = url.searchParams.get("mode") ?? "auto";  // "live" | "full" | "auto"

  try {
    let upserted: any[] = [];

    if (mode === "full") {
      upserted = await fetchAllFixtures();
    } else if (mode === "live") {
      upserted = await fetchLiveFixtures();
    } else {
      // Auto: Do a FULL fetch every time to ensure we have all fixtures with updated scores
      // The API caching (60s) on the full fetch is fast enough and ensures completeness
      upserted = await fetchAllFixtures();

      // Also fetch live fixtures for in-play score updates (runs quickly)
      const liveFixtures = await fetchLiveFixtures();
      if (liveFixtures.length > 0) {
        // Merge live fixtures in case there are in-play updates not yet in full fetch
        const liveIds = new Set(liveFixtures.map(f => f.id));
        upserted = upserted.filter(f => !liveIds.has(f.id)).concat(liveFixtures);
      }
    }

    // Log sample of fixtures with scores for debugging
    const fixturesWithScores = upserted.filter(f => f.home_score !== null && f.away_score !== null);
    console.log(`[Sync Fixtures] Total fetched: ${upserted.length}, With scores: ${fixturesWithScores.length}`);
    if (fixturesWithScores.length > 0) {
      console.log(`[Sync Fixtures] Sample with scores:`, fixturesWithScores.slice(0, 3).map(f => ({
        id: f.id,
        teams: `${f.home_team} vs ${f.away_team}`,
        score: `${f.home_score}-${f.away_score}`,
        status: f.status_short,
      })));
    }

    if (upserted.length) {
      const { error } = await supabase.from("fixtures").upsert(
        upserted.map(f => ({ ...f, updated_at: new Date().toISOString() })),
        { onConflict: "id" }
      );
      if (error) throw error;
    }

    // Lock picks for any fixture within 2 hours of kickoff (or already past).
    // RLS also enforces this server-side, but flipping the locked column gives
    // the UI an authoritative flag without re-querying time.
    const lockThresholdIso = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const { data: lockableFixtures } = await supabase
      .from("fixtures").select("id").lte("kickoff_utc", lockThresholdIso);
    const lockableIds = (lockableFixtures ?? []).map((r: any) => r.id);
    if (lockableIds.length) {
      await supabase
        .from("picks")
        .update({ locked: true })
        .eq("locked", false)
        .in("fixture_id", lockableIds);
    }

    return NextResponse.json({ ok: true, count: upserted.length, mode });
  } catch (err: any) {
    console.error("sync-fixtures error", err);
    return NextResponse.json({ error: err.message ?? "sync failed" }, { status: 500 });
  }
}
