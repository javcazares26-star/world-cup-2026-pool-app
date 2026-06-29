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

/** Canonicalize a host-city string so seed and API spellings line up. */
function canonCity(c: string | null): string {
  return (c || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Does this look like a real, determined team (vs a "1L"/"Winner 73"/"TBD" placeholder)? */
function isRealTeam(n: string | null): boolean {
  const s = (n || "").trim();
  if (!s) return false;
  if (/^(tbd|w\d|l\d|\d)/i.test(s)) return false;          // 1L, 3-EHIJK, W86, TBD…
  if (/winner|loser|runner|group|placeholder/i.test(s)) return false;
  return true;
}

const FINISHED_STATUSES = ["FT", "AET", "PEN"];

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

    // Match each API fixture to our seeded row and update THAT row's
    // score/status — never insert API-id duplicates.
    //
    //  • GROUP rows: matched by team-pair (names are fixed and known).
    //  • KNOCKOUT rows: matched by HOST CITY + KICKOFF TIME, which are fixed in
    //    the schedule regardless of who qualifies. We then copy the REAL teams,
    //    score and status straight from the API. We deliberately do NOT match
    //    knockout rows by guessed/projected teams — those are estimates and can
    //    both pick the wrong opponent and collide with unrelated results,
    //    stamping a stale "FT" onto a match that hasn't been played.
    const { data: seedRows } = await supabase
      .from("fixtures")
      .select("*")
      .lt("id", 1000000); // seeded rows are 900001-900104; API rows are >= 1,000,000

    // Split the API feed into group (by pair) and knockout (list) lookups.
    const apiGroupByPair = new Map<string, any>();
    const apiKnockout: any[] = [];
    for (const f of upserted) {
      if (f.is_knockout) apiKnockout.push(f);
      else apiGroupByPair.set(pairKey(f.home_team, f.away_team), f);
    }

    // Find the API knockout fixture for a seed row by city + nearest kickoff.
    function matchKnockoutSeed(seed: any): any | null {
      const sc = canonCity(seed.city);
      if (!sc) return null;
      const st = new Date(seed.kickoff_utc).getTime();
      let best: any = null;
      let bestDiff = Infinity;
      for (const a of apiKnockout) {
        if (canonCity(a.city) !== sc) continue;
        const diff = Math.abs(new Date(a.kickoff_utc).getTime() - st);
        if (diff < bestDiff) { bestDiff = diff; best = a; }
      }
      // Require within 36h so a city that hosts multiple knockout games on
      // different dates maps each seed row to the correct one.
      return bestDiff <= 36 * 60 * 60 * 1000 ? best : null;
    }

    const updates: any[] = [];
    const unmatched: string[] = [];
    const nowIso = new Date().toISOString();

    for (const seed of seedRows ?? []) {
      if (seed.is_knockout) {
        const a = matchKnockoutSeed(seed);
        if (!a) {
          // No real API fixture for this slot yet. If the row is holding a
          // stale "finished" status with no real backing, reset it so it stops
          // showing as played / awarding default points.
          if (FINISHED_STATUSES.includes(seed.status_short ?? "")) {
            updates.push({
              ...seed,
              home_score: null, away_score: null,
              status: "Not Started", status_short: "NS", minute: null,
              updated_at: nowIso,
            });
          }
          continue;
        }
        // Copy the real teams (only once they're actually determined — never
        // overwrite a "1L"/"W86" slot with an API placeholder), plus score+status.
        const teamsKnown = isRealTeam(a.home_team) && isRealTeam(a.away_team);
        updates.push({
          ...seed,
          ...(teamsKnown ? {
            home_team: a.home_team, home_team_id: a.home_team_id, home_logo: a.home_logo,
            away_team: a.away_team, away_team_id: a.away_team_id, away_logo: a.away_logo,
          } : {}),
          home_score: a.home_score, away_score: a.away_score,
          status: a.status, status_short: a.status_short, minute: a.minute,
          updated_at: nowIso,
        });
      } else {
        const a = apiGroupByPair.get(pairKey(seed.home_team, seed.away_team));
        if (!a) { unmatched.push(`${seed.home_team} vs ${seed.away_team}`); continue; }
        const sameOrientation = canonTeam(seed.home_team) === canonTeam(a.home_team);
        updates.push({
          ...seed,
          home_score: sameOrientation ? a.home_score : a.away_score,
          away_score: sameOrientation ? a.away_score : a.home_score,
          status: a.status,
          status_short: a.status_short,
          minute: a.minute,
          updated_at: nowIso,
        });
      }
    }

    console.log(`[Sync Fixtures] api:${upserted.length} matched:${updates.length} unmatched(group):${unmatched.length}`, unmatched.slice(0, 10));

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
