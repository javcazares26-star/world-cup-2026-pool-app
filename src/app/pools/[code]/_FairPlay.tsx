"use client";
import { useMemo } from "react";
import type { Fixture } from "@/lib/types";

type Standing = {
  team: string;
  mp: number;  // matches played
  w: number;   // wins
  d: number;   // draws
  l: number;   // losses
  gf: number;  // goals for
  ga: number;  // goals against
  gd: number;  // goal difference
  pts: number; // points
};

export function FairPlay({ fixtures }: { fixtures: Fixture[] }) {
  // Compute standings per group, only counting finished matches
  const standingsByGroup = useMemo(() => {
    const result: Record<string, Standing[]> = {};
    const finishedStatuses = new Set(["FT", "AET", "PEN"]);

    // Collect teams per group (from any fixture in that group)
    const teamsByGroup: Record<string, Set<string>> = {};
    fixtures.forEach(f => {
      if (!f.group_label) return;
      teamsByGroup[f.group_label] ??= new Set();
      teamsByGroup[f.group_label].add(f.home_team);
      teamsByGroup[f.group_label].add(f.away_team);
    });

    // Initialize standings
    Object.entries(teamsByGroup).forEach(([group, teams]) => {
      result[group] = Array.from(teams).map(t => ({
        team: t, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0,
      }));
    });

    // Walk every finished match and accumulate stats
    fixtures.forEach(f => {
      if (!f.group_label) return;
      if (!finishedStatuses.has(f.status_short ?? "")) return;
      const h = f.home_score ?? 0;
      const a = f.away_score ?? 0;
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

    // Sort each group: pts desc, GD desc, GF desc, team name asc
    Object.values(result).forEach(rows => {
      rows.sort((x, y) =>
        y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.team.localeCompare(y.team)
      );
    });
    return result;
  }, [fixtures]);

  const groups = Object.keys(standingsByGroup).sort();

  if (groups.length === 0) {
    return (
      <div className="card text-center text-[#9aa3c7]">
        No groups loaded yet. Once fixtures sync, group standings appear here.
      </div>
    );
  }

  return (
    <div>
      <div className="card mb-4">
        <h2 className="text-lg font-bold mb-1">Group standings — live</h2>
        <p className="text-sm text-[#9aa3c7]">
          Updates automatically as match results come in. Top 2 in each group + 8 best 3rd-place
          teams advance to the Round of 32. Sorted by Points → Goal Difference → Goals For.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map(group => {
          const rows = standingsByGroup[group];
          const anyPlayed = rows.some(r => r.mp > 0);
          return (
            <div key={group} className="card !p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a3566] flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-widest text-[#4cc9f0]">{group}</h3>
                {!anyPlayed && <span className="text-[10px] text-[#9aa3c7]">No matches played yet</span>}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-[#9aa3c7]">
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
                    const isQualified = i < 2;            // top 2 advance directly
                    const isThirdPlace = i === 2;          // best-3rd-place candidates
                    const bg = isQualified
                      ? "bg-[rgba(6,214,160,0.06)]"
                      : isThirdPlace
                        ? "bg-[rgba(255,210,63,0.04)]"
                        : "";
                    return (
                      <tr key={r.team} className={"border-t border-[#2a3566] " + bg}>
                        <td className="p-2 pl-3">
                          <span className={"inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold " +
                            (isQualified ? "bg-[#06d6a0] text-[#0a1a14]"
                              : isThirdPlace ? "bg-[#ffd23f] text-[#2a2200]"
                              : "bg-[#222c5a] text-[#9aa3c7]")}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="p-2 font-medium">{r.team}</td>
                        <td className="p-2 text-center">{r.mp}</td>
                        <td className="p-2 text-center text-[#06d6a0]">{r.w}</td>
                        <td className="p-2 text-center">{r.d}</td>
                        <td className="p-2 text-center text-[#ff4d6d]">{r.l}</td>
                        <td className="p-2 text-center">{r.gf}</td>
                        <td className="p-2 text-center">{r.ga}</td>
                        <td className="p-2 text-center font-mono text-xs">
                          {r.gd > 0 ? "+" + r.gd : r.gd}
                        </td>
                        <td className="p-2 pr-3 text-center font-bold text-[#ffd23f]">{r.pts}</td>
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
        <div className="flex gap-4 flex-wrap text-xs text-[#9aa3c7]">
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#06d6a0]"></span>
            Top 2 → Round of 32 (direct)
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#ffd23f]"></span>
            3rd place → competes for 8 best-3rd slots
          </span>
        </div>
      </div>
    </div>
  );
}
