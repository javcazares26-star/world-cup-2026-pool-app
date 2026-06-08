"use client";
import { useEffect, useState } from "react";

type Match = {
  id: number;
  status: string;
  statusLong: string;
  kickoff: string;
  minute: number | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  league: string;
  leagueId: number;
  season: number;
  round: string | null;
  venue: string;
  country: string;
};

/**
 * International Friendlies (June 3-10, 2026)
 *
 * Displays national team friendly matches in the week before the World Cup.
 * Shows how teams are preparing for the tournament.
 * Also serves as a test for API-Football live scores and cron job syncing.
 *
 * Visible to all pool participants.
 */
export function InternationalFriendlies() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const fetchMatches = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(
        "/api/matches/friendlies?from=2026-06-03&to=2026-06-10",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (!data || typeof data !== "object") {
        throw new Error("Invalid response format");
      }

      setMatches(Array.isArray(data.matches) ? data.matches : []);
      setLastRefresh(new Date());
      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching friendlies:", err);
      setError(err.message || "Unknown error");
      setMatches([]);
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMatches();
  }, []);

  // Auto-refresh every 2 minutes if enabled (matches cron job cadence)
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const interval = setInterval(fetchMatches, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshEnabled]);

  // Categorize by status
  const liveMatches = matches.filter(m =>
    ["1H", "2H", "ET", "PEN", "LIVE"].includes(m.status.toUpperCase())
  );
  const upcomingMatches = matches.filter(m =>
    ["NS", "NOT STARTED"].includes(m.status.toUpperCase())
  );
  const finishedMatches = matches.filter(m =>
    ["FT", "AET", "PEN", "FINISHED", "ABANDONED"].includes(m.status.toUpperCase())
  );

  // Group by date
  const byDate: Record<string, Match[]> = {};
  matches.forEach(m => {
    const date = new Date(m.kickoff).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(m);
  });

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  return (
    <div className="card bg-gradient-to-r from-[var(--card)] to-[var(--card-2)] border-2 border-dashed border-[var(--gold)] mb-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            ⚽ International Friendlies (June 3-10)
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            National teams preparing for the 2026 World Cup. Live scores update every 2 minutes.
          </p>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-1 text-xs cursor-pointer text-[var(--muted)] hover:text-[var(--text)]">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            Live updates
          </label>
          <button
            onClick={fetchMatches}
            disabled={loading}
            className="btn !py-1 !px-3 text-xs"
            title="Refresh friendly matches"
          >
            {loading ? "…" : "🔄"}
          </button>
        </div>
      </div>

      {lastRefresh && (
        <div className="text-[10px] text-[var(--muted)] mb-3 pb-3 border-b border-[var(--border)]">
          Last synced: {lastRefresh.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })} UTC
          <span className="mx-2">•</span>
          Total: <strong>{matches.length}</strong>
          <span className="mx-2">•</span>
          Live: <strong>{liveMatches.length}</strong>
        </div>
      )}

      {error && (
        <div className="text-center py-4 text-sm text-[var(--crimson)]">
          ⚠ {error}
        </div>
      )}

      {!loading && matches.length === 0 && !error && (
        <div className="text-center py-6 text-sm text-[var(--muted)]">
          No friendly matches scheduled yet.
        </div>
      )}

      {loading && matches.length === 0 && (
        <div className="text-center py-6 text-sm text-[var(--muted)]">
          Loading friendly matches…
        </div>
      )}

      {matches.length > 0 && (
        <div className="space-y-4">
          {/* Live Matches */}
          {liveMatches.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--gold)] mb-2 flex items-center gap-2">
                🔴 LIVE NOW ({liveMatches.length})
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
              <h3 className="text-sm font-semibold text-[var(--text)] mb-2 flex items-center gap-2">
                ⏱️ UPCOMING ({upcomingMatches.length})
              </h3>
              {Object.entries(byDate).map(([date, dayMatches]) => {
                const upcoming = dayMatches.filter(m =>
                  ["NS", "NOT STARTED"].includes(m.status.toUpperCase())
                );
                if (upcoming.length === 0) return null;
                return (
                  <div key={date} className="mb-4">
                    <h4 className="text-xs font-semibold text-[var(--muted)] mb-2 uppercase">
                      {date}
                    </h4>
                    <div className="space-y-2">
                      {upcoming.map(match => (
                        <MatchCard key={match.id} match={match} formatTime={formatTime} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Finished Matches */}
          {finishedMatches.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--muted)] mb-2 flex items-center gap-2">
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

      <div className="text-[10px] text-[var(--muted)] mt-4 pt-3 border-t border-[var(--border)]">
        💡 Watch how national teams prepare for the tournament. Scores update every 2 minutes via our live data pipeline.
      </div>
    </div>
  );
}

function MatchCard({ match, formatTime }: { match: Match; formatTime: (iso: string) => string }) {
  const isLive = ["1H", "2H", "ET", "PEN", "LIVE"].includes(match.status.toUpperCase());
  const isFinished = ["FT", "AET", "PEN", "FINISHED"].includes(match.status.toUpperCase());

  let statusDisplay = match.statusLong || "TBD";
  if (isLive && match.minute !== null) {
    statusDisplay = `${match.minute}'`;
  }

  return (
    <div
      className={`p-3 rounded-lg border ${
        isLive
          ? "bg-[var(--card-2)] border-[var(--gold)]"
          : "bg-[var(--card)] border-[var(--border)]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Home Team */}
        <div className="flex-1 text-right pr-2">
          <div className="text-sm font-semibold truncate">{match.homeTeam}</div>
        </div>

        {/* Score */}
        <div className="px-3 py-2 bg-[var(--bg-2)] rounded text-center min-w-[70px]">
          <div className="text-lg font-bold">
            {match.homeScore !== null && match.awayScore !== null
              ? `${match.homeScore} - ${match.awayScore}`
              : "- : -"}
          </div>
          <div
            className={`text-[10px] font-semibold ${
              isLive ? "text-[var(--gold)]" : isFinished ? "text-[var(--muted)]" : "text-[var(--text)]"
            }`}
          >
            {statusDisplay}
          </div>
        </div>

        {/* Away Team */}
        <div className="flex-1 text-left pl-2">
          <div className="text-sm font-semibold truncate">{match.awayTeam}</div>
        </div>

        {/* Time */}
        <div className="text-right">
          <div className="text-[10px] text-[var(--muted)]">{formatTime(match.kickoff)} UTC</div>
        </div>
      </div>
    </div>
  );
}
