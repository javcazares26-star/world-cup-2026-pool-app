"use client";
import { useMemo, useState } from "react";
import type { Fixture, Pick } from "@/lib/types";

type Member = {
  user_id: string;
  display_name: string;
};

type Props = {
  fixtures: Fixture[];
  picks: Pick[];
  members: Member[];
  allPicks: any[]; // All picks from database, not just user's
};

export function AdminPicks({ fixtures, picks: userPicks, members, allPicks }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"name" | "team">("name");

  // Index picks by user_id for quick lookup
  const picksByUser = useMemo(() => {
    const map: Record<string, Pick[]> = {};
    allPicks.forEach((pick: any) => {
      if (!map[pick.user_id]) map[pick.user_id] = [];
      map[pick.user_id].push(pick);
    });
    return map;
  }, [allPicks]);

  // Index fixtures by id
  const fixturesById = useMemo(() => {
    const map: Record<number, Fixture> = {};
    fixtures.forEach((f) => {
      map[f.id] = f;
    });
    return map;
  }, [fixtures]);

  // Filter members based on search
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;

    const query = searchQuery.toLowerCase();

    if (searchType === "name") {
      return members.filter((m) =>
        m.display_name.toLowerCase().includes(query)
      );
    }

    // Search by team: find members who picked that team
    return members.filter((m) => {
      const userPicks = picksByUser[m.user_id] || [];
      return userPicks.some((pick) => {
        const fixture = fixturesById[pick.fixture_id];
        if (!fixture) return false;
        return (
          fixture.home_team.toLowerCase().includes(query) ||
          fixture.away_team.toLowerCase().includes(query)
        );
      });
    });
  }, [members, searchQuery, searchType, picksByUser, fixturesById]);

  return (
    <div className="space-y-4">
      {/* Search Controls */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">🔍 Search Participant Picks</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setSearchType("name")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                searchType === "name"
                  ? "bg-[var(--gold)] text-[#1a1a1a]"
                  : "bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              👤 By Name
            </button>
            <button
              onClick={() => setSearchType("team")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                searchType === "team"
                  ? "bg-[var(--gold)] text-[#1a1a1a]"
                  : "bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              ⚽ By Team
            </button>
          </div>
          <input
            type="text"
            placeholder={searchType === "name" ? "Search by name..." : "Search by team..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-[var(--bg-2)] border border-[var(--border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--gold)]"
          />
        </div>
      </div>

      {/* Results */}
      {filteredMembers.length === 0 ? (
        <div className="card text-center py-6 text-[var(--muted)]">
          <p className="text-sm">No participants found matching "{searchQuery}"</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((member) => {
            const memberPicks = picksByUser[member.user_id] || [];
            const totalPicks = memberPicks.length;
            const picksWithFixtures = memberPicks
              .map((pick) => ({
                pick,
                fixture: fixturesById[pick.fixture_id],
              }))
              .filter((x) => x.fixture);

            return (
              <div key={member.user_id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-base">{member.display_name}</h3>
                  <span className="text-xs bg-[var(--card-2)] px-2 py-1 rounded-full">
                    {totalPicks} picks
                  </span>
                </div>

                {picksWithFixtures.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">No picks made yet</p>
                ) : (
                  <div className="space-y-2">
                    {picksWithFixtures.map(({ pick, fixture }) => {
                      const isFinished = ["FT", "AET", "PEN"].includes(fixture.status_short ?? "");
                      const isExact = isFinished && pick.home_pick === fixture.home_score && pick.away_pick === fixture.away_score;
                      const isOutcomeCorrect = isFinished &&
                        Math.sign(pick.home_pick - pick.away_pick) === Math.sign((fixture.home_score ?? 0) - (fixture.away_score ?? 0));

                      return (
                        <div
                          key={pick.id}
                          className={`rounded p-3 text-xs space-y-2 border ${
                            isExact
                              ? "bg-[rgba(6,214,160,0.1)] border-[var(--pitch-light)]"
                              : isOutcomeCorrect
                              ? "bg-[rgba(244,196,48,0.1)] border-[var(--gold)]"
                              : "bg-[var(--bg-2)] border-[var(--border)]"
                          }`}
                        >
                          <div>
                            <span className="text-[var(--muted)]">
                              {fixture.group_label || fixture.round}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {/* Participant's Pick */}
                            <div className="font-medium text-sm">
                              <span className="text-[var(--muted)]">Pick:</span>
                              <div className="mt-1 flex items-center gap-2">
                                <span>{fixture.home_team}</span>
                                <span className="font-bold bg-[var(--card-2)] px-2 py-1 rounded min-w-[50px] text-center">
                                  {pick.home_pick} - {pick.away_pick}
                                </span>
                                <span>{fixture.away_team}</span>
                              </div>
                            </div>

                            {/* Actual Score */}
                            {fixture.home_score !== null && fixture.away_score !== null && (
                              <div className="font-medium text-sm border-t border-[var(--border)] pt-2">
                                <span className="text-[var(--muted)]">
                                  {isFinished ? "Final:" : "Score:"}
                                </span>
                                <div className="mt-1 flex items-center gap-2">
                                  <span>{fixture.home_team}</span>
                                  <span className={`font-bold px-2 py-1 rounded min-w-[50px] text-center ${
                                    isExact ? "bg-[var(--pitch-light)] text-[#0a1a14]" : "bg-[var(--card-2)]"
                                  }`}>
                                    {fixture.home_score} - {fixture.away_score}
                                  </span>
                                  <span>{fixture.away_team}</span>
                                </div>
                                {isFinished && (
                                  <div className="text-[10px] text-[var(--muted)] mt-1">
                                    {isExact && "✅ Exact match! +3 points"}
                                    {isOutcomeCorrect && !isExact && "⭐ Correct outcome! +1 point"}
                                    {!isExact && !isOutcomeCorrect && "No points"}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
