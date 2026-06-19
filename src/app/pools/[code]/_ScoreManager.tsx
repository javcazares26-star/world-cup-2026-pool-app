"use client";
import { useState } from "react";
import type { Fixture } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

type Props = {
  fixtures: Fixture[];
  onScoresUpdated: () => void;
};

export function ScoreManager({ fixtures, onScoresUpdated }: Props) {
  // Filter to finished matches only
  const finishedMatches = fixtures.filter(f => f.status_short === "FT");

  // Track edited scores
  const [scores, setScores] = useState<Record<number, { home: number; away: number }>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const updateScore = (fixtureId: number, side: "home" | "away", value: string) => {
    const num = parseInt(value || "0", 10);
    setScores(prev => ({
      ...prev,
      [fixtureId]: {
        ...prev[fixtureId],
        [side]: num
      }
    }));
  };

  const getDisplayScore = (fixture: Fixture, side: "home" | "away") => {
    if (scores[fixture.id]) {
      return scores[fixture.id][side];
    }
    return side === "home" ? fixture.home_score ?? 0 : fixture.away_score ?? 0;
  };

  const hasChanges = Object.keys(scores).length > 0;

  const saveAllScores = async () => {
    setSaving(true);
    setMessage(null);
    const supabase = createClient();

    try {
      // Batch update all changed scores
      const updates = Object.entries(scores).map(([fixtureId, vals]) =>
        supabase
          .from("fixtures")
          .update({ home_score: vals.home, away_score: vals.away })
          .eq("id", parseInt(fixtureId, 10))
      );

      await Promise.all(updates);

      setMessage(`✅ ${Object.keys(scores).length} match(es) updated!`);
      setScores({});

      // Refresh leaderboard
      setTimeout(() => {
        onScoresUpdated();
        setMessage(null);
      }, 2000);
    } catch (err) {
      setMessage("❌ Error saving scores. Try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (finishedMatches.length === 0) {
    return <div className="text-[var(--muted)] p-4">No finished matches yet.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-bold text-[var(--gold)]">⚙️ Score Manager</h3>
        {message && (
          <span className={`text-sm ${message.includes("✅") ? "text-[var(--pitch-light)]" : "text-[var(--crimson)]"}`}>
            {message}
          </span>
        )}
      </div>

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--card-2)] border-b border-[var(--border)]">
              <th className="text-left p-3 font-semibold">Match</th>
              <th className="text-center p-3 font-semibold">Home Score</th>
              <th className="text-center p-3 font-semibold">Away Score</th>
              <th className="text-left p-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {finishedMatches.map(fixture => {
              const isModified = !!scores[fixture.id];
              const homeScore = getDisplayScore(fixture, "home");
              const awayScore = getDisplayScore(fixture, "away");

              return (
                <tr
                  key={fixture.id}
                  className={`border-t border-[var(--border)] ${isModified ? "bg-[rgba(244,196,48,0.1)]" : ""}`}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted)] font-semibold">
                        {fixture.group_label || fixture.round}
                      </span>
                      <span className="font-semibold">
                        {fixture.home_team} vs {fixture.away_team}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={homeScore}
                      onChange={(e) => updateScore(fixture.id, "home", e.target.value)}
                      className="w-16 bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-center font-bold hover:border-[var(--gold)] focus:border-[var(--gold)] outline-none"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={awayScore}
                      onChange={(e) => updateScore(fixture.id, "away", e.target.value)}
                      className="w-16 bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-center font-bold hover:border-[var(--gold)] focus:border-[var(--gold)] outline-none"
                    />
                  </td>
                  <td className="p-3">
                    {isModified ? (
                      <span className="text-xs font-semibold text-[var(--gold)]">Pending...</span>
                    ) : (
                      <span className="text-xs text-[var(--muted)]">FT</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasChanges && (
        <div className="flex gap-3">
          <button
            onClick={saveAllScores}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 disabled:opacity-50 transition"
          >
            {saving ? "Saving..." : `💾 Save ${Object.keys(scores).length} Change(s)`}
          </button>
          <button
            onClick={() => setScores({})}
            className="px-6 py-2 bg-[var(--card-2)] text-[var(--muted)] font-semibold rounded hover:bg-[var(--card-3)] transition"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
