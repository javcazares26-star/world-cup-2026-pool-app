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
import { projectKnockout } from "@/lib/bracket-projection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

/**
 * Canonicalize a team name so API-Football names and our seeded names match.
 * Strips accents/punctuation/case, then collapses known naming variants.
 */
function canonTeam(name: string): string {
  let s = (name || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // strip accents (Curaçao -> Curacao)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // drop spaces, dots, ampersands, slashes
  const aliases: Record<string, string> = {
    repofkorea: "korea", southkorea: "korea", korearepublic: "korea", koreasouth: "korea", korearep: "korea",
    czechrep: "czech", czechia: "czech", czechrepublic: "czech",
    bosniaherzeg: "bosnia", bosniaherzegovina: "bosnia", bosniaandherzegovina: "bosnia",
    drcongo: "congo", congodr: "congo", democraticrepublicofcongo: "congo", congodemocraticrepublic: "congo",
    capeverde: "capeverde", capeverdeislands: "capeverde", caboverde: "capeverde",
    usa: "usa", unitedstates: "usa", unitedstatesofamerica: "usa", us: "usa",
    ivorycoast: "ivorycoast", cotedivoire: "ivorycoast",
    turkey: "turkey", turkiye: "turkey",
    iran: "iran", iranislamicrepublic: "iran",
  };
  return aliases[s] ?? s;
}

/** Order-independent key for a fixture's two teams. */
function pairKey(a: string, b: string): string {
  return [canonTeam(a), canonTeam(b)].sort().join("|");
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
  const mode = url.searchParams.get("mode") ?? "auto";  // "live" | "full" | "auto" | "diag"

  // ---- Diagnostic mode: read-only. Reveals whether API-Football returns data,
  //      what IDs/names it uses, and whether any match the rows in our DB. ----
  if (mode === "diag") {
    try {
      const apiFixtures = await fetchAllFixtures();
      const { data: dbRows } = await supabase
        .from("fixtures")
        .select("id, home_team, away_team, kickoff_utc");
      const dbIds = new Set((dbRows ?? []).map((r: any) => r.id));
      const overlap = apiFixtures.filter(f => dbIds.has(f.id)).length;
      return NextResponse.json({
        diag: true,
        env: {
          keyPresent: !!process.env.API_FOOTBALL_KEY,
          league: process.env.API_FOOTBALL_LEAGUE_ID ?? "1",
          season: process.env.API_FOOTBALL_SEASON ?? "2026",
        },
        api: {
          count: apiFixtures.length,
          withScores: apiFixtures.filter(f => f.home_score !== null).length,
          sample: apiFixtures.slice(0, 8).map(f => ({
            id: f.id, home: f.home_team, away: f.away_team,
            date: f.kickoff_utc, status: f.status_short,
            score: `${f.home_score ?? "-"}-${f.away_score ?? "-"}`,
          })),
        },
        db: {
          count: dbRows?.length ?? 0,
          apiIdsAlreadyInDb: overlap,
          sample: (dbRows ?? []).slice(0, 8).map((r: any) => ({
            id: r.id, home: r.home_team, away: r.away_team, date: r.kickoff_utc,
          })),
        },
      });
    } catch (err: any) {
      return NextResponse.json({ diag: true, error: err.message ?? "diag failed" }, { status: 500 });
    }
  }

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

    // Match each API fixture to our seeded row by team-pair and update THAT
    // row's score/status — never insert API-id duplicates. Knockout seed rows
    // carry placeholder names (1A, 3-ABCDF) so they won't match until teams are
    // determined; those are skipped here and handled via the bracket.
    const { data: seedRows } = await supabase
      .from("fixtures")
      .select("*")
      .lt("id", 1000000); // seeded rows are 900001-900104; API rows are >= 1,000,000

    // Resolve knockout fixtures' DETERMINED teams (R32 from finished groups,
    // later rounds only when their feeder matches are actually finished — no
    // rank guessing). This lets us match live knockout matches by real teams.
    const koDetermined = projectKnockout(seedRows ?? [], [], { determinedOnly: true });

    const seedByPair = new Map<string, { row: any; homeName: string }>();
    for (const r of seedRows ?? []) {
      if (r.is_knockout) {
        const res = koDetermined[r.id];
        if (res?.home && res?.away) {
          seedByPair.set(pairKey(res.home, res.away), { row: r, homeName: res.home });
        }
      } else {
        seedByPair.set(pairKey(r.home_team, r.away_team), { row: r, homeName: r.home_team });
      }
    }

    const updates: any[] = [];
    const unmatched: string[] = [];
    const nowIso = new Date().toISOString();
    for (const f of upserted) {
      const entry = seedByPair.get(pairKey(f.home_team, f.away_team));
      if (!entry) { unmatched.push(`${f.home_team} vs ${f.away_team}`); continue; }
      // Orient API scores to the seeded row's (resolved) home/away order
      const sameOrientation = canonTeam(entry.homeName) === canonTeam(f.home_team);
      updates.push({
        ...entry.row,
        home_score: sameOrientation ? f.home_score : f.away_score,
        away_score: sameOrientation ? f.away_score : f.home_score,
        status: f.status,
        status_short: f.status_short,
        minute: f.minute,
        updated_at: nowIso,
      });
    }

    console.log(`[Sync Fixtures] api:${upserted.length} matched:${updates.length} unmatched:${unmatched.length}`, unmatched.slice(0, 10));

    if (updates.length) {
      const { error } = await supabase.from("fixtures").upsert(updates, { onConflict: "id" });
      if (error) throw error;
    }

    // Lock picks for any fixture within 2 hours of kickoff (or already past).
    // RLS also enforces this server-side, but flipping the locked column gives
    // the UI an authoritative flag without re-querying time.
    const lockThresholdIso = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString();
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

    return NextResponse.json({
      ok: true, mode,
      apiCount: upserted.length,
      matched: updates.length,
      unmatched: unmatched.length,
      unmatchedSample: unmatched.slice(0, 10),
    });
  } catch (err: any) {
    console.error("sync-fixtures error", err);
    return NextResponse.json({ error: err.message ?? "sync failed" }, { status: 500 });
  }
}
