"use client";
import { useMemo } from "react";
import type { Fixture, Pick } from "@/lib/types";
import { getTeamFlag } from "@/lib/team-flags";

type Standing = {
  team: string;
  mp: number;  // matches played (or projected)
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
};

export function FairPlay({ fixtures, picks }: { fixtures: Fixture[]; picks: Pick[] }) {
  const finishedStatuses = new Set(["FT", "AET", "PEN"]);
  // Live matches count provisionally so positions move in real time
  const liveStatuses = new Set(["1H", "2H", "ET", "HT", "BT", "P", "LIVE"]);

  // Tournament starts June 11, 2026
  const TOURNAMENT_START = new Date("2026-06-11T00:00:00Z");
  const isTournamentStarted = new Date() >= TOURNAMENT_START;
  const daysUntilStart = Math.ceil((TOURNAMENT_START.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  // === Compute standings: prefer real scores when match is finished; else use the user's pick ===
  const { standingsByGroup, finishedCount, projectedCount } = useMemo(() => {
    const result: Record<string, Standing[]> = {};
    let finished = 0;
    const projected = 0;

    // Initialize all teams in each group
    const teamsByGroup: Record<string, Set<string>> = {};
    fixtures.forEach(f => {
      if (!f.group_label) return;
      teamsByGroup[f.group_label] ??= new Set();
      teamsByGroup[f.group_label].add(f.home_team);
      teamsByGroup[f.group_label].add(f.away_team);
    });
    Object.entries(teamsByGroup).forEach(([group, teams]) => {
      result[group] = Array.from(teams).map(t => ({
        team: t, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0,
      }));
    });

    // Apply each group-stage fixture — real results only (finished + live).
    // Upcoming/unplayed matches are NOT counted (no projection from picks).
    fixtures.forEach(f => {
      if (!f.group_label) return;
      const status = f.status_short ?? "";
      const counts = finishedStatuses.has(status) || liveStatuses.has(status);
      if (!counts || f.home_score === null || f.away_score === null) return;
      const h = f.home_score;
      const a = f.away_score;
      finished++;

      const homeRow = result[f.group_label].find(r => r.team === f.home_team);
      const awayRow = result[f.group_label].find(r => r.team === f.away_team);
      if (!homeRow || !awayRow) return;

      homeRow.mp++; awayRow.mp++;
      homeRow.gf += h; homeRow.ga += a;
      awayRow.gf += a; awayRow.ga += h;
      homeRow.gd = homeRow.gf - homeRow.ga;
      awayRow.gd = awayRow.gf - awayRow.ga;
      if (h > a) { homeRow.w++; homeRow.pts += 3; awayRow.l++; }
      else if (h < a) { awayRow.w++; awayRow.pts += 3; homeRow.l++; }
      else { homeRow.d++; awayRow.d++; homeRow.pts++; awayRow.pts++; }
    });

    Object.values(result).forEach(rows => {
      rows.sort((x, y) =>
        y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.team.localeCompare(y.team)
      );
    });
    return { standingsByGroup: result, finishedCount: finished, projectedCount: projected };
  }, [fixtures, picks]);

  const groups = Object.keys(standingsByGroup).sort();

  if (groups.length === 0) {
    return (
      <div className="card text-center text-[var(--muted)]">
        No groups loaded yet. Once fixtures sync, group standings appear here.
      </div>
    );
  }

  const isMostlySimulation = projectedCount > finishedCount;

  // Show pre-tournament message and reset standings if tournament hasn't started
  const displayStandings = isTournamentStarted ? standingsByGroup :
    Object.fromEntries(
      Object.entries(standingsByGroup).map(([group, rows]) => [
        group,
        rows.map(r => ({ ...r, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }))
      ])
    );

  return (
    <div>
      <div className="card mb-4">
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
          <h2 className="text-lg font-bold">Group standings</h2>
          <span className={"text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full " +
            (!isTournamentStarted
              ? "bg-[var(--crimson)] text-white"
              : isMostlySimulation
              ? "bg-[var(--gold)] text-[#1a1408]"
              : "bg-[var(--pitch-light)] text-white")}>
            {!isTournamentStarted ? "⏳ Not started" : isMostlySimulation ? "🔮 Simulation" : "📡 Live results"}
          </span>
        </div>
        <p className="text-sm text-[var(--muted)]">
          {!isTournamentStarted ? (
            <>Tournament starts <strong>June 11</strong>. All picks reset to 0. Once matches begin, standings will update in real-time.</>
          ) : isMostlySimulation ? (
            <>Showing projected standings based on <strong>your picks</strong>. Once a match is finished, real scores replace your prediction in the calculation.</>
          ) : (
            <>Standings update in <strong>real time</strong> from finished and in-progress matches. Upcoming matches aren&apos;t counted until they kick off.</>
          )}
        </p>
        <p className="text-[10px] text-[var(--muted)] mt-2 opacity-80">
          {!isTournamentStarted ? (
            `Tournament begins in ${daysUntilStart} day${daysUntilStart === 1 ? "" : "s"}. Top 2 in each group + 8 best 3rd-place teams advance to Round of 32.`
          ) : (
            `${finishedCount} match${finishedCount === 1 ? "" : "es"} counted (finished + live) · Top 2 in each group + 8 best 3rd-place teams advance to Round of 32.`
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map(group => {
          const rows = displayStandings[group];
          const anyCounted = rows.some(r => r.mp > 0);
          return (
            <div key={group} className="card !p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-widest text-[var(--sky)]">{group}</h3>
                {!anyCounted && <span className="text-[10px] text-[var(--muted)]">No finished matches yet</span>}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    <th className="text-left p-2 pl-3">#</th>
                    <th className="text-left p-2">Team</th>
                    <th className="text-center p-2" title="Matches Played">MP</th>
                    <th className="text-center p-2" title="Wins">W</th>
                    <th className="text-center p-2" title="Draws">D</th>
                    <th className="text-center p-2" title="Losses">L</th>
                    <th className="text-center p-2" title="Goals For">GF</th>
                    <th className="text-center p-2" title="Goals Against">GA</th>
                    <th className="text-center p-2" title="Goal Difference">GD</th>
                    <th className="text-center p-2 pr-3" title="Points">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const isQualified = i < 2;
                    const isThirdPlace = i === 2;
                    const bg = isQualified
                      ? "bg-[rgba(6,214,160,0.06)]"
                      : isThirdPlace
                        ? "bg-[rgba(244,196,48,0.04)]"
                        : "";
                    return (
                      <tr key={r.team} className={"border-t border-[var(--border)] " + bg}>
                        <td className="p-2 pl-3">
                          <span className={"inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold " +
                            (isQualified ? "bg-[var(--pitch-light)] text-[#0a1a14]"
                              : isThirdPlace ? "bg-[var(--gold)] text-[#2a2200]"
                              : "bg-[var(--card-2)] text-[var(--muted)]")}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="p-2 font-medium flex items-center gap-2">
                          <span>{getTeamFlag(r.team)}</span>
                          {r.team}
                        </td>
                        <td className="p-2 text-center">{r.mp}</td>
                        <td className="p-2 text-center text-[var(--pitch-light)]">{r.w}</td>
                        <td className="p-2 text-center">{r.d}</td>
                        <td className="p-2 text-center text-[var(--crimson)]">{r.l}</td>
                        <td className="p-2 text-center">{r.gf}</td>
                        <td className="p-2 text-center">{r.ga}</td>
                        <td className="p-2 text-center font-mono text-xs">
                          {r.gd > 0 ? "+" + r.gd : r.gd}
                        </td>
                        <td className="p-2 pr-3 text-center font-bold text-[var(--gold)]">{r.pts}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      <div className="card mt-4 !py-3">
        <div className="flex gap-4 flex-wrap text-xs text-[var(--muted)]">
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-[var(--pitch-light)]"></span>
            Top 2 → Round of 32 (direct)
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-[var(--gold)]"></span>
            3rd place → competes for 8 best-3rd slots
          </span>
        </div>
      </div>
    </div>
  );
}
