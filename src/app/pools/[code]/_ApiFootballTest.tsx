"use client";
import { useState } from "react";

/**
 * Admin Testing: API-Football Connectivity Test
 *
 * Simple test to verify API-Football integration is working.
 * Admin-only component.
 */
export function ApiFootballTest({ isPoolOwner }: { isPoolOwner: boolean }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    status: "ok" | "error";
    message: string;
    timestamp: string;
  } | null>(null);

  if (!isPoolOwner) {
    return null;
  }

  const testConnection = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Test a simple fixture query for June 11 (tournament start)
      const res = await fetch(
        `/api/matches/teams?from=2026-06-11&to=2026-06-11`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (data.count > 0) {
        setResult({
          status: "ok",
          message: `✅ API-Football connected! Found ${data.count} matches on June 11, 2026.`,
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        setResult({
          status: "ok",
          message: `✅ API-Football connected! No matches scheduled for June 11, 2026.`,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      setResult({
        status: "error",
        message: `❌ Connection failed: ${err.message}`,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-gradient-to-r from-[var(--card)] to-[var(--card-2)] border-2 border-dashed border-[var(--gold)] mb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            🔌 API-Football Connectivity Test
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Verify real-time fixture syncing with API-Football.
          </p>
        </div>
        <button
          onClick={testConnection}
          disabled={loading}
          className="btn !py-2 !px-4 text-sm whitespace-nowrap"
        >
          {loading ? "Testing…" : "Test Connection"}
        </button>
      </div>

      {result && (
        <div className={`mt-4 p-3 rounded-lg ${
          result.status === "ok"
            ? "bg-[rgba(6,214,160,0.1)] border border-[var(--pitch-light)]"
            : "bg-[rgba(220,38,38,0.1)] border border-[var(--crimson)]"
        }`}>
          <p className="text-sm font-medium">{result.message}</p>
          <p className="text-[10px] text-[var(--muted)] mt-1">
            Last tested: {result.timestamp}
          </p>
        </div>
      )}
    </div>
  );
}
