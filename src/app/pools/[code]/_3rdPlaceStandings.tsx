"use client";
import type { Fixture, Pick } from "@/lib/types";
import { getRanked3rdPlaceTeams } from "@/lib/group-standings";

type Props = {
  fixtures: Fixture[];
  picks: Pick[];
};

export function ThirdPlaceStandings({ fixtures, picks }: Props) {
  const standings = getRanked3rdPlaceTeams(fixtures, picks);

  return (
    <div className="card">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h3 className="font-bold text-sm">🥉 3rd Place Standings</h3>
        <p className="text-xs text-[var(--muted)] mt-1">
          Top 8 teams qualify for Round of 32
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-4 py-2 font-semibold text-[var(--muted)]">
                #
              </th>
              <th className="text-left px-4 py-2 font-semibold text-[var(--muted)]">
                Team
              </th>
              <th className="text-center px-4 py-2 font-semibold text-[var(--muted)]">
                GRP
              </th>
              <th className="text-center px-4 py-2 font-semibold text-[var(--muted)]">
                P
              </th>
              <th className="text-center px-4 py-2 font-semibold text-[var(--muted)]">
                GD
              </th>
              <th className="text-center px-4 py-2 font-semibold text-[var(--muted)]">
                PTS
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, idx) => {
              const isQualified = idx < 8;
              return (
                <tr
                  key={team.team}
                  className={`border-b border-[var(--border)] last:border-b-0 ${
                    isQualified ? "bg-[rgba(0,180,100,0.05)]" : ""
                  }`}
                >
                  <td
                    className={`text-center px-4 py-2 font-bold ${
                      isQualified
                        ? "text-[var(--pitch-light)]"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    {idx + 1}
                    {isQualified && (
                      <span className="ml-1 text-[10px]">✓</span>
                    )}
                  </td>
                  <td className="text-left px-4 py-2 font-medium">
                    {team.team}
                  </td>
                  <td className="text-center px-4 py-2 text-[var(--muted)]">
                    {team.group}
                  </td>
                  <td className="text-center px-4 py-2">
                    {team.wins}-{team.draws}-{team.losses}
                  </td>
                  <td
                    className={`text-center px-4 py-2 font-semibold ${
                      team.goalDifference > 0
                        ? "text-[var(--pitch-light)]"
                        : team.goalDifference < 0
                          ? "text-[var(--crimson)]"
                          : ""
                    }`}
                  >
                    {team.goalDifference > 0 ? "+" : ""}
                    {team.goalDifference}
                  </td>
                  <td className="text-center px-4 py-2 font-bold">
                    {team.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 bg-[var(--card-2)] text-xs text-[var(--muted)]">
        <p>✓ = Qualified for Round of 32</p>
      </div>
    </div>
  );
}
