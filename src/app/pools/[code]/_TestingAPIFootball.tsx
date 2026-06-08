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
 * Testing API-Football Integration (Admin Only)
 *
 * Displays all soccer matches happening today worldwide (any league, club, or national team)
 * to test and verify:
 * - API-Football connectivity and data freshness
 * - Cron job is updating scores in real-time
 * - Live score updates across multiple matches simultaneously
 * - Data pipeline end-to-end functionality
 *
 * Auto-hides on June 10, 2026 (one day before tournament starts).
 * Can be manually disabled by the user.
 */
export function TestingAPIFootball() {
  const [isVisible, setIsVisible] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Auto-disable on June 10, 2026 at 00:00 UTC
  const DISABLE_DATE = new Date("2026-06-10T00:00:00Z");
  const isAfterDisableDate = new Date() >= DISABLE_DATE;

  if (isAfterDisableDate || !isVisible) {
    return null;
  }

  const fetchMatches = async () => {
    try {
      setError(null);
      const res = await fetch("/api/matches/today");
      if (!res.ok) throw new Error("Failed to fetch matches");
      const data = await res.json();
      setMatches(data.matches || []);
      setLastRefresh(new Date());
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
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
    const interval = setInterval(fetchMatches, 2 * 60 * 1000); // 2 minutes
    return () => clearInterval(interval);
  }, [autoRefreshEnabled]);

  // Categorize matches
  const liveMatches = matches.filter(m => ["1H", "2H", "ET", "PEN", "LIVE"].includes(m.status.toUpperCase()));
  const upcomingMatches = matches.filter(m => ["NS", "NOT STARTED"].includes(m.status.toUpperCase()));
  const finishedMatches = matches.filter(m => ["FT", "AET", "PEN", "FINISHED", "ABANDONED"].includes(m.status.toUpperCase()));

  // Group by league
  const byLeague = matches.reduce((acc, match) => {
    const league = match.league;
    if (!acc[league]) acc[league] = [];
    acc[league].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

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
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            🧪 Testing API-Football Integration
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            All soccer matches worldwide happening today. Verifying API connectivity, live scores, and cron job syncing.
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
            Auto-refresh (2 min)
          </label>
          <button
            onClick={fetchMatches}
            disabled={loading}
            className="btn !py-1 !px-3 text-xs"
            title="Manually refresh all matches from API-Football"
          >
            {loading ? "…" : "🔄 Refresh"}
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
        <div className="text-[10px] text-[var(--muted)] mb-3 pb-3 border-b border-[var(--border)]">
          Last synced: {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} UTC
          <span className="mx-2">•</span>
          Total matches: <strong>{matches.length}</strong>
          <span className="mx-2">•</span>
          Live: <strong>{liveMatches.length}</strong>
          <span className="mx-2">•</span>
          Leagues: <strong>{Object.keys(byLeague).length}</strong>
        </div>
      )}

      {error && (
        <div className="text-center py-4 text-sm text-[var(--crimson)]">
          ⚠ Error: {error}
        </div>
      )}

      {!loading && matches.length === 0 && !error && (
        <div className="text-center py-6 text-sm text-[var(--muted)]">
          No matches scheduled for today ({formatDate(new Date().toISOString())}).
          <div className="text-[10px] mt-1 opacity-70">
            API-Football integration is working! Check back when there are matches.
          </div>
        </div>
      )}

      {loading && matches.length === 0 && (
        <div className="text-center py-6 text-sm text-[var(--muted)]">
          Loading matches from API-Football…
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
              <h3 className="text-sm font-semibold text-[var(--muted)] mb-2 flex items-center gap-2">
                ✓ FINISHED ({finishedMatches.length})
              </h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {finishedMatches.map(match => (
                  <MatchCard key={match.id} match={match} formatTime={formatTime} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-[10px] text-[var(--muted)] mt-4 pt-3 border-t border-[var(--border)]">
        💡 <strong>Testing Tips:</strong> Enable auto-refresh to verify the cron job is syncing scores every 2 minutes. Watch for live matches to update in real-time. Check timestamps to confirm data freshness. This section tests API-Football connectivity, live updates, and the full data pipeline.
      </div>
    </div>
  );
}

function MatchCard({ match, formatTime }: { match: Match; formatTime: (iso: string) => string }) {
  const isLive = ["1H", "2H", "ET", "PEN", "LIVE"].includes(match.status.toUpperCase());
  const isFinished = ["FT", "AET", "PEN", "FINISHED"].includes(match.status.toUpperCase());

  // Determine status display
  let statusDisplay = match.statusLong || "TBD";
  if (isLive && match.minute !== null) {
    statusDisplay = `${match.minute}'`;
  }

  return (
    <div className={`p-3 rounded-lg border ${isLive ? "bg-[var(--card-2)] border-[var(--gold)]" : "bg-[var(--card)] border-[var(--border)]"}`}>
      <div className="flex items-center justify-between gap-3 mb-2">
        {/* Home Team */}
        <div className="flex-1 text-right pr-2">
          <div className="text-sm font-semibold truncate">{match.homeTeam}</div>
        </div>

        {/* Score / Status */}
        <div className="px-3 py-2 bg-[var(--bg-2)] rounded text-center min-w-[70px]">
          <div className="text-lg font-bold">
            {match.homeScore !== null && match.awayScore !== null
              ? `${match.homeScore} - ${match.awayScore}`
              : "- : -"}
          </div>
          <div className={`text-[10px] font-semibold ${isLive ? "text-[var(--gold)]" : isFinished ? "text-[var(--muted)]" : "text-[var(--text)]"}`}>
            {statusDisplay}
          </div>
        </div>

        {/* Away Team */}
        <div className="flex-1 text-left pl-2">
          <div className="text-sm font-semibold truncate">{match.awayTeam}</div>
        </div>
      </div>

      {/* Match Details */}
      <div className="text-[10px] text-[var(--muted)] flex items-center justify-between px-1">
        <span>{match.league}</span>
        <span>{formatTime(match.kickoff)} UTC</span>
        <span>{match.venue}</span>
      </div>
    </div>
  );
}
