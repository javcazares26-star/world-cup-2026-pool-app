"use client";
import { useEffect, useState } from "react";

type Match = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  statusLong: string;
  kickoff: string;
};

/**
 * Admin Testing: API-Football Connectivity Test
 *
 * Shows soccer matches from past and upcoming weeks.
 * Helps verify API-Football integration is working.
 *
 * Admin-only component.
 */
export function ApiFootballTest({ isPoolOwner }: { isPoolOwner: boolean }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  if (!isPoolOwner) {
    return null;
  }

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get date range: past 2 weeks and next 4 weeks
      const today = new Date();
      const fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - 14); // 2 weeks ago
      const toDate = new Date(today);
      toDate.setDate(toDate.getDate() + 28); // 4 weeks from now

      const fromStr = fromDate.toISOString().split("T")[0];
      const toStr = toDate.toISOString().split("T")[0];

      const res = await fetch(
        `/api/matches/teams?from=${fromStr}&to=${toStr}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (Array.isArray(data.matches)) {
        setMatches(data.matches);
        setLastRefresh(new Date().toLocaleTimeString());
      } else {
        setError("No matches found");
        setMatches([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch matches");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    fetchMatches();
  }, []);

  // Categorize matches
  const liveMatches = matches.filter(m =>
    ["1H", "2H", "ET", "PEN", "LIVE"].includes(m.status.toUpperCase())
  );
  const upcomingMatches = matches.filter(m =>
    ["NS", "NOT STARTED"].includes(m.status.toUpperCase())
  ).sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
  const finishedMatches = matches.filter(m =>
    ["FT", "AET", "PEN", "FINISHED", "ABANDONED"].includes(m.status.toUpperCase())
  ).sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime());

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMin = Math.round((now.getTime() - date.getTime()) / 60000);
    if (diffMin < 0) {
      // Future match
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="card bg-gradient-to-r from-[var(--card)] to-[var(--card-2)] border-2 border-dashed border-[var(--gold)] mb-4">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            🔌 API-Football Connectivity Test
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Soccer matches from past 2 weeks & next 4 weeks
          </p>
        </div>
        <button
          onClick={fetchMatches}
          disabled={loading}
          className="btn !py-2 !px-4 text-sm whitespace-nowrap"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {lastRefresh && (
        <div className="text-[10px] text-[var(--muted)] mb-3">
          Last synced: {lastRefresh} • Total: <strong>{matches.length}</strong> matches
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-[rgba(220,38,38,0.1)] border border-[var(--crimson)] mb-3">
          <p className="text-sm text-[var(--crimson)]">⚠️ {error}</p>
        </div>
      )}

      {matches.length === 0 && !loading && !error && (
        <div className="text-center py-6 text-sm text-[var(--muted)]">
          No matches found. Click "Refresh" to load matches.
        </div>
      )}

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[var(--gold)] mb-2 flex items-center gap-2">
            🔴 Live Now ({liveMatches.length})
          </h3>
          <div className="space-y-2">
            {liveMatches.map(m => (
              <div key={m.id} className="bg-[var(--card)] border border-[var(--gold)] rounded p-2 flex items-center justify-between text-sm">
                <div className="flex-1">{m.homeTeam}</div>
                <div className="text-center font-bold min-w-[60px]">
                  {m.homeScore} - {m.awayScore}
                </div>
                <div className="flex-1 text-right">{m.awayTeam}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[var(--gold)] mb-2 flex items-center gap-2">
            📅 Upcoming ({upcomingMatches.length})
          </h3>
          <div className="space-y-2">
            {upcomingMatches.slice(0, 8).map(m => (
              <div key={m.id} className="bg-[var(--card)] border border-[var(--border)] rounded p-2 flex items-center justify-between text-sm">
                <div className="flex-1">{m.homeTeam}</div>
                <div className="text-center text-[10px] text-[var(--muted)] min-w-[50px]">
                  {formatTime(m.kickoff)}
                </div>
                <div className="flex-1 text-right">{m.awayTeam}</div>
              </div>
            ))}
            {upcomingMatches.length > 8 && (
              <p className="text-[10px] text-[var(--muted)] text-center">
                +{upcomingMatches.length - 8} more upcoming
              </p>
            )}
          </div>
        </div>
      )}

      {/* Finished Matches */}
      {finishedMatches.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--gold)] mb-2 flex items-center gap-2">
            ✅ Finished ({finishedMatches.length})
          </h3>
          <div className="space-y-2">
            {finishedMatches.slice(0, 5).map(m => (
              <div key={m.id} className="bg-[var(--card)] border border-[var(--border)] rounded p-2 flex items-center justify-between text-sm">
                <div className="flex-1">{m.homeTeam}</div>
                <div className="text-center font-bold min-w-[60px]">
                  {m.homeScore} - {m.awayScore}
                </div>
                <div className="flex-1 text-right text-[10px] text-[var(--muted)]">
                  {formatTime(m.kickoff)}
                </div>
              </div>
            ))}
            {finishedMatches.length > 5 && (
              <p className="text-[10px] text-[var(--muted)] text-center">
                +{finishedMatches.length - 5} more finished
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
