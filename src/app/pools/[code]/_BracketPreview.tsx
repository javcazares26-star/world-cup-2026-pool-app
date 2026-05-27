"use client";
import { useMemo } from "react";
import type { Fixture, Pick } from "@/lib/types";
import { simulateKnockoutStage, type QualifiedTeam } from "@/lib/bracket-simulator";

type Props = {
  fixtures: Fixture[];
  picks: Pick[];
};

export function BracketPreview({ fixtures, picks }: Props) {
  const simulation = useMemo(() => {
    return simulateKnockoutStage(fixtures, picks);
  }, [fixtures, picks]);

  const groupStandingsArray = useMemo(() => {
    return Object.entries(simulation.standings);
  }, [simulation.standings]);

  return (
    <div className="space-y-6">
      {/* Intro message */}
      <div className="card border-l-4" style={{ borderLeftColor: "var(--gold)" }}>
        <h3 className="font-bold text-sm flex items-center gap-2">
          🔮 Bracket Preview
        </h3>
        <p className="text-xs text-[var(--muted)] mt-2 leading-relaxed">
          Based on your current picks, here's who would qualify from each group. This updates in real-time as you change your predictions. Once the tournament starts, this will be replaced with actual group results.
        </p>
      </div>

      {/* Group Standings */}
      <div>
        <h2 className="text-lg font-bold text-[var(--gold)] mb-4">📋 Group Standings (Simulated)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupStandingsArray.map(([group, standings]) => (
            <div key={group} className="card !p-0 overflow-hidden">
              <div className="group-banner px-4 py-3 border-b border-[var(--border)] text-xs text-[var(--gold)] font-bold">
                GROUP {group}
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--muted)] text-[10px] uppercase">
                    <th className="text-left p-2">Pos</th>
                    <th className="text-left p-2">Team</th>
                    <th className="text-center p-2">P</th>
                    <th className="text-center p-2">Pts</th>
                    <th className="text-center p-2">GD</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team, idx) => {
                    const isQualified = idx < 2;
                    const is3rdPlace = idx === 2;
                    return (
                      <tr
                        key={team.team}
                        className={`border-b border-[var(--border)] last:border-b-0 ${
                          isQualified
                            ? "bg-[rgba(193,26,54,0.1)]"
                            : is3rdPlace
                            ? "bg-[rgba(218,165,32,0.05)]"
                            : "bg-[var(--card-2)]"
                        }`}
                      >
                        <td className="p-2 font-bold">
                          {idx + 1}
                          {isQualified && " ✓"}
                        </td>
                        <td className="p-2">{team.team}</td>
                        <td className="text-center p-2">{team.plays}</td>
                        <td className="text-center p-2 font-bold">{team.points}</td>
                        <td className="text-center p-2 text-[var(--muted)]">
                          {team.goalDifference > 0 ? "+" : ""}
                          {team.goalDifference}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      {/* Qualified Teams Summary */}
      <div className="card">
        <h2 className="text-lg font-bold text-[var(--gold)] mb-4">🏆 Qualified Teams</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {simulation.qualified.map((team, idx) => (
            <div
              key={`${team.group}-${team.position}`}
              className="bg-[var(--card-2)] rounded-lg p-3 text-center text-xs"
            >
              {team.logo && (
                <img src={team.logo} alt="" className="w-8 h-8 mx-auto mb-2 rounded-full" />
              )}
              <div className="font-bold text-[var(--text)]">{team.team}</div>
              <div className="text-[var(--muted)] text-[10px] mt-1">
                {team.position === 1 ? "🥇 1st" : team.position === 2 ? "🥈 2nd" : "🥉 3rd"} Group {team.group}
              </div>
              <div className="text-[10px] text-[var(--gold)] mt-1">{team.points} pts</div>
            </div>
          ))}
        </div>
      </div>

      {/* Round of 32 Preview */}
      <div className="card">
        <h2 className="text-lg font-bold text-[var(--gold)] mb-4">🎯 Round of 32 Preview</h2>
        <p className="text-xs text-[var(--muted)] mb-4">
          These matchups are based on your current predictions. The actual bracket will update as group stage results are determined.
        </p>
        <div className="space-y-2">
          {simulation.bracketMatches.slice(0, 32).map((match, idx) => {
            if (!match.homeTeam || !match.awayTeam) return null;
            return (
              <div
                key={match.id}
                className="flex items-center justify-between bg-[var(--bg-2)] rounded-lg p-3 text-xs border border-[var(--border)]"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {match.homeTeam.logo && (
                      <img src={match.homeTeam.logo} alt="" className="w-4 h-4" />
                    )}
                    <span className="font-bold text-[var(--text)]">{match.homeTeam.team}</span>
                    <span className="text-[10px] text-[var(--muted)]">
                      ({match.homeQualification})
                    </span>
                  </div>
                </div>
                <div className="px-3 text-[var(--muted)] font-bold">vs</div>
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[10px] text-[var(--muted)]">
                      ({match.awayQualification})
                    </span>
                    <span className="font-bold text-[var(--text)]">{match.awayTeam.team}</span>
                    {match.awayTeam.logo && (
                      <img src={match.awayTeam.logo} alt="" className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Help text */}
      <div className="card !bg-[var(--card-2)] text-xs text-[var(--muted)]">
        <p>
          <strong>How it works:</strong> The simulator analyzes all picks in the pool and averages predictions for each group
          match to simulate final group standings. Teams are ranked by points, goal difference, and goals scored. Top 2 from
          each group + best 8 third-place finishers advance to knockout stage.
        </p>
      </div>
    </div>
  );
}
