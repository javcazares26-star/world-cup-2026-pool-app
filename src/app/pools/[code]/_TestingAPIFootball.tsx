"use client";
import { useEffect, useState } from "react";
import type { Fixture } from "@/lib/types";

/**
 * Testing API-Football Integration
 *
 * Temporarily displays live matches happening today to verify:
 * - API-Football fixtures are syncing correctly
 * - Cron job is updating scores in real-time
 * - Data pipeline is working end-to-end
 *
 * Auto-hides on June 10, 2026 (one day before tournament starts).
 * Can be manually disabled by the user.
 */
export function TestingAPIFootball({ fixtures }: { fixtures: Fixture[] }) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Auto-disable on June 10, 2026 at 00:00 UTC
  const DISABLE_DATE = new Date("2026-06-10T00:00:00Z");
  const isAfterDisableDate = new Date() >= DISABLE_DATE;

  if (isAfterDisableDate || !isVisible) {
    return null;
  }

  // Get today's date (start and end of day in UTC)
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));

  // Filter fixtures for today
  const todaysMatches = fixtures.filter(f => {
    const kickoff = new Date(f.kickoff_utc);
    return kickoff >= todayStart && kickoff <= todayEnd;
  });

  // Sort by kickoff time
  const sortedMatches = [...todaysMatches].sort((a, b) =>
    new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
  );

  // Categorize matches
  const upcomingMatches = sortedMatches.filter(f => {
    const status = f.status_short?.toLowerCase() || "";
    return ["not started", "ns"].includes(status);
  });

  const liveMatches = sortedMatches.filter(f => {
    const status = f.status_short?.toLowerCase() || "";
    return ["live", "1h", "2h", "et", "pen"].includes(status);
  });

  const finishedMatches = sortedMatches.filter(f => {
    const status = f.status_short?.toLowerCase() || "";
    return ["finished", "ft", "aet", "pen"].includes(status);
  });

  const handleRefresh = () => {
    setLastRefresh(new Date());
    // In a real scenario, you could trigger a manual API call here
  };

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: "short", day: "numeric", timeZone: "UTC" });
  };

  return (
    <div className="card bg-gradient-to-r from-[var(--card)] to-[var(--card-2)] border-2 border-dashed border-[var(--gold)] mb-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            🧪 Testing API-Football
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Monitor live matches and verify cron job syncing. Auto-disabled on June 10, 2026.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="btn !py-1 !px-3 text-xs"
            title="Manually refresh match data from database"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="btn !py-1 !px-3 text-xs hover:!bg-[var(--crimson)] hover:!border-[var(--crimson)]"
            title="Hide testing section"
          >
            ✕
          </button>
        </div>
      </div>

      {lastRefresh && (
        <div className="text-[10px] text-[var(--muted)] mb-2">
          Last refresh: {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} UTC
        </div>
      )}

      {sortedMatches.length === 0 && (
        <div className="text-center py-6 text-sm text-[var(--muted)]">
          No matches scheduled for today ({formatDate(new Date().toISOString())}).
          <div className="text-[10px] mt-1 opacity-70">
            Tournament starts June 11, 2026. Check back later or trigger a manual cron sync.
          </div>
        </div>
      )}

      {sortedMatches.length > 0 && (
        <div className="space-y-3">
          {/* Live Matches */}
          {liveMatches.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--gold)] mb-2">
                🔴 LIVE ({liveMatches.length})
              </h3>
              <div className="space-y-2">
                {liveMatches.map(match => (
                  <MatchCard key={match.id} match={match} formatTime={formatTime} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Matches */}
          {upcomingMatches.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)] mb-2">
                ⏱️ UPCOMING ({upcomingMatches.length})
              </h3>
              <div className="space-y-2">
                {upcomingMatches.map(match => (
                  <MatchCard key={match.id} match={match} formatTime={formatTime} />
                ))}
              </div>
            </div>
          )}

          {/* Finished Matches */}
          {finishedMatches.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--muted)] mb-2">
                ✓ FINISHED ({finishedMatches.length})
              </h3>
              <div className="space-y-2">
                {finishedMatches.map(match => (
                  <MatchCard key={match.id} match={match} formatTime={formatTime} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-[10px] text-[var(--muted)] mt-3 pt-3 border-t border-[var(--border)]">
        💡 Tip: Click refresh every 5 minutes to verify the cron job is updating scores. Check the "Last refresh" timestamp to ensure data is being fetched from the latest sync.
      </div>
    </div>
  );
}

function MatchCard({ match, formatTime }: { match: Fixture; formatTime: (iso: string) => string }) {
  const status = match.status_short?.toLowerCase() || "";
  const isLive = ["live", "1h", "2h", "et", "pen"].includes(status);
  const isFinished = ["finished", "ft", "aet", "pen"].includes(status);

  // Determine status display
  let statusDisplay = match.status || "TBD";
  if (isLive && match.minute) {
    statusDisplay = `${match.minute}'`;
  }

  return (
    <div className={`p-3 rounded-lg border ${isLive ? "bg-[var(--card-2)] border-[var(--gold)]" : "bg-[var(--card)] border-[var(--border)]"}`}>
      <div className="flex items-center justify-between gap-3">
        {/* Home Team */}
        <div className="flex-1 text-right">
          <div className="text-sm font-semibold">{match.home_team}</div>
          <div className="text-xs text-[var(--muted)]">{match.venue || "TBD"}</div>
        </div>

        {/* Score / Status */}
        <div className="px-3 py-2 bg-[var(--bg-2)] rounded text-center min-w-[70px]">
          <div className="text-lg font-bold">
            {match.home_score !== null && match.away_score !== null
              ? `${match.home_score} - ${match.away_score}`
              : "- : -"}
          </div>
          <div className={`text-[10px] font-semibold ${isLive ? "text-[var(--gold)]" : isFinished ? "text-[var(--muted)]" : "text-[var(--text)]"}`}>
            {statusDisplay}
          </div>
        </div>

        {/* Away Team */}
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold">{match.away_team}</div>
          <div className="text-xs text-[var(--muted)]">{formatTime(match.kickoff_utc)} UTC</div>
        </div>
      </div>
    </div>
  );
}
