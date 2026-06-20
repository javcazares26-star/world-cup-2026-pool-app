"use client";
import type { Fixture } from "@/lib/types";
import { calculateGroupStandings, getAllGroupStandings, getRanked3rdPlaceTeams, getQualified3rdPlaceTeams } from "@/lib/group-standings";

type Props = {
  fixtures: Fixture[];
};

export function PotentialBracket({ fixtures }: Props) {
  try {
    // Get current standings for all groups
    const allGroupStandings = getAllGroupStandings(fixtures);

  // Get the ranked 3rd place teams
  const all3rdPlace = getRanked3rdPlaceTeams(allGroupStandings);

  // Get only the qualified 3rd place teams (top 8)
  const qualified3rdPlace = getQualified3rdPlaceTeams(allGroupStandings);

  // Determine which teams qualify in each position
  const qualifiedTeams: Record<string, string> = {};

  // Winners (1st place from each group A-L)
  Object.entries(allGroupStandings).forEach(([group, standings]) => {
    if (standings.length > 0) {
      const winner = standings[0]?.team;
      if (winner) {
        qualifiedTeams[`1${group}`] = winner;
      }
    }
  });

  // Runners-up (2nd place from each group A-L)
  Object.entries(allGroupStandings).forEach(([group, standings]) => {
    if (standings.length > 1) {
      const runnerup = standings[1]?.team;
      if (runnerup) {
        qualifiedTeams[`2${group}`] = runnerup;
      }
    }
  });

  // Third place (top 8 of 12)
  qualified3rdPlace.forEach((entry) => {
    qualifiedTeams[entry.position] = entry.team;
  });

  // Check if group stage is complete
  const groupFixtures = fixtures.filter(f => !f.is_knockout);
  const finishedCount = groupFixtures.filter(f => f.status_short === "FT").length;
  const totalCount = groupFixtures.length;
  const groupStageComplete = finishedCount === totalCount && totalCount > 0;

  // Bracket match-ups (Round of 32)
  const bracketMatchups = [
    { slot: 1, home: "1A", away: "2B", label: "Match 1" },
    { slot: 2, home: "1C", away: "2D", label: "Match 2" },
    { slot: 3, home: "1E", away: "2F", label: "Match 3" },
    { slot: 4, home: "1G", away: "2H", label: "Match 4" },
    { slot: 5, home: "1B", away: "2A", label: "Match 5" },
    { slot: 6, home: "1D", away: "2C", label: "Match 6" },
    { slot: 7, home: "1F", away: "2E", label: "Match 7" },
    { slot: 8, home: "1H", away: "2G", label: "Match 8" },
    { slot: 9, home: "1I", away: "2J", label: "Match 9" },
    { slot: 10, home: "1K", away: "2L", label: "Match 10" },
    { slot: 11, home: "1J", away: "2I", label: "Match 11" },
    { slot: 12, home: "1L", away: "2K", label: "Match 12" },
    { slot: 13, home: "3A", away: "3B", label: "Match 13" },
    { slot: 14, home: "3C", away: "3D", label: "Match 14" },
    { slot: 15, home: "3E", away: "3F", label: "Match 15" },
    { slot: 16, home: "3G", away: "3H", label: "Match 16" },
  ];

  return (
    <div className="mb-6">
      <div className="card !p-0 overflow-hidden border-2 border-[var(--gold)] border-opacity-30">
        <div className="group-banner px-4 py-3 border-b-2 border-[var(--gold)] bg-gradient-to-r from-[var(--gold)] to-[var(--gold)] bg-opacity-10 text-sm font-bold text-[var(--gold)] flex items-center justify-between">
          <span>⚡ Potential Round of 32 Matchups (Based on Current Standings)</span>
          <span className="text-xs font-normal text-[var(--muted)]">
            {finishedCount} / {totalCount} group matches finished
          </span>
        </div>

        {!groupStageComplete && finishedCount > 0 && (
          <div className="px-4 py-3 bg-[var(--card-2)] border-b border-[var(--border)] text-xs text-[var(--muted)]">
            💡 These matchups will update as group stage matches are played. Currently {finishedCount}/{totalCount} completed.
          </div>
        )}

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {bracketMatchups.map((match) => {
            const homeTeam = qualifiedTeams[match.home];
            const awayTeam = qualifiedTeams[match.away];
            const isReady = homeTeam && awayTeam;

            return (
              <div
                key={match.slot}
                className={`rounded-lg border-2 p-3 transition-colors ${
                  isReady
                    ? "border-[var(--gold)] bg-[var(--card-2)]"
                    : "border-[var(--border)] bg-[var(--card-3)] opacity-60"
                }`}
              >
                <div className="text-xs font-bold text-[var(--gold)] mb-2 text-center">
                  {match.label}
                </div>

                {/* Home Team */}
                <div className="text-center mb-2 pb-2 border-b border-[var(--border)]">
                  <div className="text-xs font-semibold text-[var(--muted)]">
                    {match.home}
                  </div>
                  <div className={`text-sm font-bold ${isReady ? "text-[var(--text)]" : "text-[var(--muted)]"}`}>
                    {homeTeam ?? "—"}
                  </div>
                </div>

                {/* Away Team */}
                <div className="text-center">
                  <div className="text-xs font-semibold text-[var(--muted)]">
                    {match.away}
                  </div>
                  <div className={`text-sm font-bold ${isReady ? "text-[var(--text)]" : "text-[var(--muted)]"}`}>
                    {awayTeam ?? "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-4 py-3 bg-[var(--card-3)] border-t border-[var(--border)] text-xs text-[var(--muted)]">
          <div className="grid grid-cols-3 gap-2 font-semibold">
            <div>🥇 <span className="text-[var(--text)]">1A-1L</span> = Group Winners</div>
            <div>🥈 <span className="text-[var(--text)]">2A-2L</span> = Runners-up</div>
            <div>🥉 <span className="text-[var(--text)]">3A-3H</span> = Top 8 3rd Place</div>
          </div>
        </div>
      </div>
    </div>
  } catch (error) {
    console.error("PotentialBracket error:", error);
    return (
      <div className="mb-6 card !p-4 border-l-4" style={{ borderLeftColor: "var(--crimson)" }}>
        <div className="text-sm text-[var(--muted)]">
          ⚠️ Potential bracket is loading. Check back in a moment.
        </div>
      </div>
    );
  }
}
