"use client";
import { Fragment, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTeamFlag } from "@/lib/team-flags";
import type { LeaderboardRow, Pool, Fixture, Pick } from "@/lib/types";

type UserStats = {
  groupPoints: number;
  koPoints: number;
  exact: number;
  outcome: number;
  played: number; // picks made on finished matches
  hits: number; // finished picks that scored > 0
  currentStreak: number; // consecutive most-recent finished picks scoring > 0
  bestStreak: number;
  accuracy: number; // hits / played
};

const FINISHED = ["FT", "AET", "PEN"];

function pointsFor(p: Pick, f: Fixture): number {
  if (f.home_score === null || f.away_score === null) return 0;
  if (p.home_pick === f.home_score && p.away_pick === f.away_score) return 3;
  const ps = Math.sign(p.home_pick - p.away_pick);
  const as = Math.sign(f.home_score - f.away_score);
  return ps === as ? 1 : 0;
}

export function Leaderboard({
  rows,
  meId,
  pool,
  fixtures = [],
}: {
  rows: LeaderboardRow[];
  meId: string;
  pool: Pool;
  fixtures?: Fixture[];
}) {
  const [allPicks, setAllPicks] = useState<Pick[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Fetch every member's picks for this pool (RLS allows pool members to read them)
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.from("picks").select("*").eq("pool_id", pool.id);
      if (data) setAllPicks(data as Pick[]);
    })();
  }, [pool.id]);

  // Finished fixtures in chronological order (for streak math)
  const finishedFixtures = useMemo(
    () =>
      fixtures
        .filter((f) => FINISHED.includes(f.status_short || "") && f.home_score !== null && f.away_score !== null)
        .sort((a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()),
    [fixtures]
  );

  const fixtureById = useMemo(() => {
    const m = new Map<number, Fixture>();
    finishedFixtures.forEach((f) => m.set(f.id, f));
    return m;
  }, [finishedFixtures]);

  // Per-user supplementary stats
  const statsByUser = useMemo(() => {
    const byUser = new Map<string, Pick[]>();
    allPicks.forEach((p) => {
      if (!byUser.has(p.user_id)) byUser.set(p.user_id, []);
      byUser.get(p.user_id)!.push(p);
    });

    const out = new Map<string, UserStats>();
    byUser.forEach((picks, userId) => {
      const pickByFixture = new Map<number, Pick>();
      picks.forEach((p) => pickByFixture.set(p.fixture_id, p));

      let groupPoints = 0,
        koPoints = 0,
        exact = 0,
        outcome = 0,
        played = 0,
        hits = 0;

      // Walk finished fixtures in chronological order for streaks
      const timeline: number[] = []; // points sequence for matches the user picked
      for (const f of finishedFixtures) {
        const p = pickByFixture.get(f.id);
        if (!p) continue;
        const pts = pointsFor(p, f);
        played++;
        if (pts === 3) exact++;
        else if (pts === 1) outcome++;
        if (pts > 0) hits++;
        if (f.is_knockout) koPoints += pts;
        else groupPoints += pts;
        timeline.push(pts);
      }

      // Current streak = trailing run of >0; best streak = longest run of >0
      let currentStreak = 0;
      for (let i = timeline.length - 1; i >= 0; i--) {
        if (timeline[i] > 0) currentStreak++;
        else break;
      }
      let bestStreak = 0,
        run = 0;
      for (const pts of timeline) {
        if (pts > 0) {
          run++;
          bestStreak = Math.max(bestStreak, run);
        } else run = 0;
      }

      out.set(userId, {
        groupPoints,
        koPoints,
        exact,
        outcome,
        played,
        hits,
        currentStreak,
        bestStreak,
        accuracy: played > 0 ? Math.round((hits / played) * 100) : 0,
      });
    });
    return out;
  }, [allPicks, finishedFixtures]);

  // Filter out hidden admin
  const visibleRows = rows.filter((r) => !(r.user_id === pool.owner_id && pool.admin_hidden));

  const getProperRank = (index: number): number => {
    const currentPoints = visibleRows[index].points;
    return visibleRows.filter((r) => r.points > currentPoints).length + 1;
  };

  // Pool-wide highlights
  const highlights = useMemo(() => {
    let hotName = "—",
      hotVal = 0,
      accName = "—",
      accVal = 0,
      exName = "—",
      exVal = 0;
    visibleRows.forEach((r) => {
      const s = statsByUser.get(r.user_id);
      if (!s) return;
      if (s.currentStreak > hotVal) {
        hotVal = s.currentStreak;
        hotName = r.display_name;
      }
      if (s.played >= 3 && s.accuracy > accVal) {
        accVal = s.accuracy;
        accName = r.display_name;
      }
      const ex = r.exact_count ?? s.exact;
      if (ex > exVal) {
        exVal = ex;
        exName = r.display_name;
      }
    });
    return { hotName, hotVal, accName, accVal, exName, exVal };
  }, [visibleRows, statsByUser]);

  const hasStats = finishedFixtures.length > 0 && allPicks.length > 0;

  // ===== Today's matches + everyone's picks (revealed once a match locks) =====
  const LOCK_LEAD_MS = 2 * 60 * 60 * 1000; // reveal picks once within lock window
  const userName = useMemo(
    () => new Map(rows.map(r => [r.user_id, r.display_name] as const)),
    [rows]
  );
  const todaysPicks = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const todays = fixtures
      .filter(f => {
        if (f.id >= 1000000) return false; // skip leftover duplicate API-id rows; use seeded rows only
        const k = new Date(f.kickoff_utc);
        return k >= start && k < end;
      })
      .sort((a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime());

    return todays.map(f => {
      const revealed =
        (f.status_short != null && f.status_short !== "NS") ||
        Date.now() >= new Date(f.kickoff_utc).getTime() - LOCK_LEAD_MS;
      const matchPicks = allPicks
        .filter(p => p.fixture_id === f.id)
        .map(p => ({
          userId: p.user_id,
          name: userName.get(p.user_id) ?? "Player",
          home: p.home_pick,
          away: p.away_pick,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return { fixture: f, revealed, matchPicks };
    });
  }, [fixtures, allPicks, userName]);

  const finishedSet = new Set(["FT", "AET", "PEN"]);

  return (
    <div className="space-y-4">
      {/* Highlight strip */}
      {hasStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="card !p-3 flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Hottest streak</div>
              <div className="font-bold text-[var(--text)]">{highlights.hotName}</div>
              <div className="text-xs text-[var(--gold)] font-semibold">{highlights.hotVal} in a row</div>
            </div>
          </div>
          <div className="card !p-3 flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Best accuracy</div>
              <div className="font-bold text-[var(--text)]">{highlights.accName}</div>
              <div className="text-xs text-[var(--gold)] font-semibold">{highlights.accVal}% scoring</div>
            </div>
          </div>
          <div className="card !p-3 flex items-center gap-3">
            <span className="text-2xl">💎</span>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Most exact scores</div>
              <div className="font-bold text-[var(--text)]">{highlights.exName}</div>
              <div className="text-xs text-[var(--gold)] font-semibold">{highlights.exVal} exact</div>
            </div>
          </div>
        </div>
      )}

      {/* Today's picks — what everyone predicted (revealed once a match locks) */}
      {todaysPicks.length > 0 && (
        <div className="card !p-0 overflow-hidden">
          <div className="group-banner px-4 py-3 border-b border-[var(--border)] text-sm font-bold text-[var(--gold)]">
            👀 Today&apos;s Picks — what everyone predicted
          </div>
          <div className="divide-y divide-[var(--border)]">
            {todaysPicks.map(({ fixture: f, revealed, matchPicks }) => {
              const isFinal = finishedSet.has(f.status_short ?? "");
              return (
                <div key={f.id} className="p-3">
                  <div className="flex items-center justify-between text-sm font-semibold mb-2">
                    <span className="flex items-center gap-1.5">
                      {getTeamFlag(f.home_team)} {f.home_team}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[var(--card-2)] text-xs">
                      {isFinal || (f.status_short && f.status_short !== "NS")
                        ? `${f.home_score ?? 0} - ${f.away_score ?? 0}`
                        : "vs"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {f.away_team} {getTeamFlag(f.away_team)}
                    </span>
                  </div>
                  {!revealed ? (
                    <p className="text-[11px] text-[var(--muted)] text-center py-1">
                      🔒 Picks hidden until this match locks
                    </p>
                  ) : matchPicks.length === 0 ? (
                    <p className="text-[11px] text-[var(--muted)] text-center py-1">No picks made</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {matchPicks.map(mp => {
                        const exact = isFinal && mp.home === f.home_score && mp.away === f.away_score;
                        const correct =
                          isFinal && !exact &&
                          Math.sign(mp.home - mp.away) === Math.sign((f.home_score ?? 0) - (f.away_score ?? 0));
                        const cls = exact
                          ? "bg-[var(--pitch-light)] text-[#0a1a14]"
                          : correct
                            ? "bg-[var(--gold)] text-[#2a2200]"
                            : "bg-[var(--card-2)] text-[var(--text)]";
                        return (
                          <span key={mp.userId} className={"text-[11px] px-2 py-1 rounded-full " + cls}>
                            {mp.name.split(" ")[0]} <strong>{mp.home}-{mp.away}</strong>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard table */}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
              <th className="text-left p-3">#</th>
              <th className="text-left p-3">Player</th>
              <th className="text-right p-3">Pts</th>
              <th className="text-right p-3 hidden sm:table-cell">Exact</th>
              <th className="text-right p-3 hidden sm:table-cell">Outcome</th>
              <th className="text-right p-3">🔥</th>
              <th className="text-right p-3 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-[var(--muted)] p-6">
                  No picks yet. Be the first!
                </td>
              </tr>
            )}
            {visibleRows.map((r, i) => {
              const me = r.user_id === meId;
              const rank = getProperRank(i);
              const s = statsByUser.get(r.user_id);
              const isOpen = expanded === r.user_id;
              const rankClass =
                rank === 1 ? "rank-gold" : rank === 2 ? "rank-silver" : rank === 3 ? "rank-bronze" : "bg-[var(--card-2)]";
              return (
                <Fragment key={r.user_id}>
                  <tr
                    onClick={() => setExpanded(isOpen ? null : r.user_id)}
                    className={
                      "border-t border-[var(--border)] cursor-pointer hover:bg-[rgba(255,255,255,0.03)] " +
                      (me ? "bg-[rgba(244,196,48,0.08)]" : "")
                    }
                  >
                    <td className="p-3">
                      <span className={"inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold " + rankClass}>
                        {rank}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {r.avatar_url && <img src={r.avatar_url} alt="" className="w-7 h-7 rounded-full" />}
                        <div>
                          <span className={me ? "font-bold" : ""}>
                            {r.display_name}
                            {me && " 👤"}
                          </span>
                          {s && s.played > 0 && (
                            <div className="text-[10px] text-[var(--muted)] sm:hidden">
                              {s.accuracy}% acc · 💎{r.exact_count ?? s.exact}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right font-bold text-[var(--gold)]">{r.points}</td>
                    <td className="p-3 text-right hidden sm:table-cell">
                      <span className="text-[var(--pitch-light)] font-semibold">{r.exact_count ?? 0}</span>
                      <span className="text-[10px] text-[var(--muted)] ml-1">×3</span>
                    </td>
                    <td className="p-3 text-right hidden sm:table-cell">
                      <span className="text-[var(--gold)] font-semibold">{r.correct_count ?? s?.outcome ?? 0}</span>
                      <span className="text-[10px] text-[var(--muted)] ml-1">×1</span>
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {s && s.currentStreak > 0 ? (
                        <span className="text-[var(--crimson)]">{s.currentStreak}</span>
                      ) : (
                        <span className="text-[var(--muted)]">–</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-[var(--muted)]">{isOpen ? "▲" : "▼"}</td>
                  </tr>
                  {isOpen && s && (
                    <tr className="border-t border-[var(--border)] bg-[var(--card-2)]">
                      <td colSpan={7} className="p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <Stat label="Group pts" value={s.groupPoints} />
                          <Stat label="Knockout pts" value={s.koPoints} />
                          <Stat label="Accuracy" value={`${s.accuracy}%`} sub={`${s.hits}/${s.played} scored`} />
                          <Stat label="Best streak" value={s.bestStreak} sub={`now ${s.currentStreak}`} />
                          <Stat label="Exact scores" value={r.exact_count ?? s.exact} />
                          <Stat label="Correct outcomes" value={r.correct_count ?? s.outcome} />
                          <Stat label="Picks scored" value={s.hits} />
                          <Stat label="Finished picks" value={s.played} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {hasStats && (
          <div className="px-4 py-2 text-[10px] text-[var(--muted)] border-t border-[var(--border)]">
            Tap a row for a full breakdown. 🔥 = current scoring streak (consecutive finished picks worth points).
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-lg bg-[var(--card-3)] p-2">
      <div className="text-lg font-bold text-[var(--gold)]">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{label}</div>
      {sub && <div className="text-[10px] text-[var(--muted)] mt-0.5">{sub}</div>}
    </div>
  );
}
