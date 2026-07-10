"use client";
import { useMemo, useState } from "react";
import type { Fixture, Pick } from "@/lib/types";
import { pickPoints } from "@/lib/scoring";

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

export function AdminPicks({ fixtures, picks: _userPicks, members, allPicks }: Props) {
  const [nameQuery, setNameQuery] = useState("");
  const [teamQuery, setTeamQuery] = useState("");

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

  const nq = nameQuery.trim().toLowerCase();
  const tq = teamQuery.trim().toLowerCase();

  const fixtureHasTeam = (f: Fixture | undefined) =>
    !!f && (f.home_team.toLowerCase().includes(tq) || f.away_team.toLowerCase().includes(tq));

  // Members filtered by BOTH name (if given) and team (if given)
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (nq && !m.display_name.toLowerCase().includes(nq)) return false;
      if (tq) {
        const ps = picksByUser[m.user_id] || [];
        const hasTeam = ps.some((pick) => fixtureHasTeam(fixturesById[pick.fixture_id]));
        if (!hasTeam) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, nq, tq, picksByUser, fixturesById]);

  return (
    <div className="space-y-4">
      {/* Search Controls */}
      <div className="card">
        <h2 className="font-bold text-lg mb-1">🔍 Search Participant Picks</h2>
        <p className="text-xs text-[var(--muted)] mb-3">
          Search by member, by team, or <strong>both together</strong> (e.g. a member&apos;s picks for one team).
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="👤 Member name…"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            className="flex-1 bg-[var(--bg-2)] border border-[var(--border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--gold)]"
          />
          <input
            type="text"
            placeholder="⚽ Team…"
            value={teamQuery}
            onChange={(e) => setTeamQuery(e.target.value)}
            className="flex-1 bg-[var(--bg-2)] border border-[var(--border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--gold)]"
          />
          {(nameQuery || teamQuery) && (
            <button
              onClick={() => { setNameQuery(""); setTeamQuery(""); }}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {filteredMembers.length === 0 ? (
        <div className="card text-center py-6 text-[var(--muted)]">
          <p className="text-sm">No participants match this search.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((member) => {
            const memberPicks = picksByUser[member.user_id] || [];
            let picksWithFixtures = memberPicks
              .map((pick) => ({ pick, fixture: fixturesById[pick.fixture_id] }))
              .filter((x) => x.fixture);

            // When a team filter is active, narrow each member's picks to it
            if (tq) picksWithFixtures = picksWithFixtures.filter((x) => fixtureHasTeam(x.fixture));

            return (
              <div key={member.user_id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-base">{member.display_name}</h3>
                  <span className="text-xs bg-[var(--card-2)] px-2 py-1 rounded-full">
                    {picksWithFixtures.length}{tq ? ` of ${memberPicks.length}` : ""} picks
                  </span>
                </div>

                {picksWithFixtures.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">No matching picks.</p>
                ) : (
                  <div className="space-y-2">
                    {picksWithFixtures.map(({ pick, fixture }) => {
                      const isFinished = ["FT", "AET", "PEN"].includes(fixture.status_short ?? "");
                      const pts = pickPoints(pick.home_pick, pick.away_pick, fixture);
                      const isExact = pts >= 3; // 3 (group/R32) or 6 (R16 → Final)
                      const isOutcomeCorrect = pts === 1;

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
                                    {isExact && `✅ Exact match! +${pts} points`}
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
