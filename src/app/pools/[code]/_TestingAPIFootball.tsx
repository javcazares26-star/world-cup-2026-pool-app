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
 * Displays up to 5 live soccer matches happening worldwide to test and verify:
 * - API-Football connectivity and data freshness
 * - Cron job is updating scores in real-time every 2 minutes
 * - Live score updates working properly
 *
 * Auto-hides on June 10, 2026 (one day before tournament starts).
 */
export function TestingAPIFootball() {
  const [isVisible, setIsVisible] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
  };

  // Auto-disable on June 10, 2026 at 00:00 UTC
  const DISABLE_DATE = new Date("2026-06-10T00:00:00Z");
  const isAfterDisableDate = new Date() >= DISABLE_DATE;

  // Safety check: don't render if not visible or after disable date
  const shouldRender = isVisible && !isAfterDisableDate;

  if (!shouldRender) {
    return null;
  }

  const fetchMatches = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch("/api/matches/today", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

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
      console.error("Error fetching matches:", err);
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
    const interval = setInterval(fetchMatches, 2 * 60 * 1000); // 2 minutes
    return () => clearInterval(interval);
  }, [autoRefreshEnabled]);

  // Filter for only live matches (in progress)
  const liveMatches = matches
    .filter(m => ["1H", "2H", "ET", "PEN", "LIVE"].includes(m.status.toUpperCase()))
    .slice(0, 5); // Show only first 5 live matches

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  };

  return (
    <div className="card bg-gradient-to-r from-[var(--card)] to-[var(--card-2)] border-2 border-dashed border-[var(--gold)] mb-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            🧪 Testing API-Football Live Scores
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Up to 5 live matches worldwide. Verifying API connectivity and 2-minute cron syncing.
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
            Auto (2 min)
          </label>
          <button
            onClick={fetchMatches}
            disabled={loading}
            className="btn !py-1 !px-3 text-xs"
            title="Manually refresh live matches"
          >
            {loading ? "…" : "🔄"}
          </button>
          <button
            onClick={handleClose}
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
        </div>
      )}

      {error && (
        <div className="text-center py-3 text-sm text-[var(--crimson)]">
          ⚠ {error}
        </div>
      )}

      {!loading && liveMatches.length === 0 && !error && (
        <div className="text-center py-4 text-sm text-[var(--muted)]">
          No live matches right now. API-Football is ready to go!
        </div>
      )}

      {loading && liveMatches.length === 0 && (
        <div className="text-center py-4 text-sm text-[var(--muted)]">
          Loading live matches…
        </div>
      )}

      {liveMatches.length > 0 && (
        <div className="space-y-2">
          {liveMatches.map(match => (
            <MatchCard key={match.id} match={match} formatTime={formatTime} />
          ))}
        </div>
      )}

      <div className="text-[10px] text-[var(--muted)] mt-3 pt-3 border-t border-[var(--border)]">
        💡 Enable auto-refresh to verify scores update every 2 minutes from the cron job.
      </div>
    </div>
  );
}

function MatchCard({ match, formatTime }: { match: Match; formatTime: (iso: string) => string }) {
  let statusDisplay = `${match.minute}'` || "LIVE";

  return (
    <div className="p-3 rounded-lg bg-[var(--card-2)] border border-[var(--gold)]">
      <div className="flex items-center justify-between gap-3">
        {/* Home Team */}
        <div className="flex-1 text-right">
          <div className="text-sm font-semibold truncate">{match.homeTeam}</div>
          <div className="text-[10px] text-[var(--muted)]">{match.league}</div>
        </div>

        {/* Score / Status */}
        <div className="px-3 py-2 bg-[var(--bg-2)] rounded text-center min-w-[60px]">
          <div className="text-lg font-bold">
            {match.homeScore !== null && match.awayScore !== null
              ? `${match.homeScore} - ${match.awayScore}`
              : "- : -"}
          </div>
          <div className="text-[10px] font-semibold text-[var(--gold)]">
            {statusDisplay}
          </div>
        </div>

        {/* Away Team */}
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold truncate">{match.awayTeam}</div>
          <div className="text-[10px] text-[var(--muted)]">{formatTime(match.kickoff)} UTC</div>
        </div>
      </div>
    </div>
  );
}
