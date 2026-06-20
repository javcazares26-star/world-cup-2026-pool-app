"use client";
import { useMemo } from "react";
import type { Fixture, Pick } from "@/lib/types";
import { MatchRow } from "./_MatchRow";

type Props = {
  fixtures: Fixture[];
  picks: Pick[];
  onSave: (fixtureId: number, home: number, away: number) => void;
  userLocation: string | null;
  isAdmin?: boolean;
};

export function UpcomingMatches({ fixtures, picks, onSave, userLocation, isAdmin }: Props) {
  // Get genuinely upcoming GROUP-STAGE matches: not started, kickoff still in
  // the future (so past matches that haven't synced a result don't linger here),
  // and excluding knockout fixtures (those live under the Knockout Stage view).
  const upcomingFixtures = useMemo(() => {
    const now = Date.now();
    return fixtures
      .filter(f =>
        f.status_short === "NS" &&
        !f.is_knockout &&
        new Date(f.kickoff_utc).getTime() > now
      )
      .sort((a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime());
  }, [fixtures]);

  // Group by day
  const groupedByDay = useMemo(() => {
    const groups: Record<string, Fixture[]> = {};

    upcomingFixtures.forEach(f => {
      const date = new Date(f.kickoff_utc);
      const dayKey = date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
      (groups[dayKey] ??= []).push(f);
    });

    return groups;
  }, [upcomingFixtures]);

  if (upcomingFixtures.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-[var(--gold)] mb-4 flex items-center gap-2">
        📅 Matches to Play
      </h2>
      <div className="space-y-4">
        {Object.entries(groupedByDay).map(([day, dayMatches]) => (
          <div key={day} className="card !p-0 overflow-hidden">
            <div className="group-banner px-4 py-3 border-b border-[var(--border)] text-sm font-semibold text-[var(--gold)]">
              {day}
            </div>
            <div className="space-y-0">
              {dayMatches.map(m => (
                <MatchRow
                  key={m.id}
                  fixture={m}
                  pick={picks.find(p => p.fixture_id === m.id)}
                  onSave={onSave}
                  showScore={false}
                  userLocation={userLocation}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
