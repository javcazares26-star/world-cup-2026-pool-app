"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Fixture } from "@/lib/types";

type Props = {
  fixtures: Fixture[];
};

export function FixtureScoreManager({ fixtures }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [saving, setSaving] = useState(false);

  // Find finished matches without scores
  const needScores = fixtures.filter(f =>
    (f.status_short === "FT" || f.status_short === "AET" || f.status_short === "PEN") &&
    (f.home_score === null || f.away_score === null)
  );

  const withScores = fixtures.filter(f => f.home_score !== null && f.away_score !== null).length;

  const handleSave = async (fixtureId: number) => {
    if (homeScore === "" || awayScore === "") return;
    setSaving(true);

    const supabase = createClient();
    await supabase
      .from("fixtures")
      .update({ home_score: parseInt(homeScore), away_score: parseInt(awayScore) })
      .eq("id", fixtureId);

    setSaving(false);
    setEditingId(null);
    setHomeScore("");
    setAwayScore("");
  };

  return (
    <div className="card">
      <h2 className="font-bold text-lg mb-3">📊 Fixture Score Manager</h2>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-[var(--card-2)] p-2 rounded text-center">
          <div className="text-xs text-[var(--muted)]">Total</div>
          <div className="font-bold">{fixtures.length}</div>
        </div>
        <div className="bg-[var(--card-2)] p-2 rounded text-center">
          <div className="text-xs text-[var(--muted)]">With Scores</div>
          <div className="font-bold text-green-400">{withScores}</div>
        </div>
        <div className="bg-[var(--card-2)] p-2 rounded text-center">
          <div className="text-xs text-[var(--muted)]">Need Scores</div>
          <div className={`font-bold ${needScores.length > 0 ? "text-red-400" : "text-green-400"}`}>
            {needScores.length}
          </div>
        </div>
      </div>

      {/* Fixtures without scores */}
      {needScores.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {needScores.map(f => (
            <div key={f.id} className="flex items-center gap-2 p-2 bg-[var(--card-2)] rounded border border-[var(--border)]">
              {editingId === f.id ? (
                <>
                  <div className="flex-1 text-xs font-semibold truncate">
                    {f.home_team} vs {f.away_team}
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    className="w-10 bg-[var(--bg)] border border-[var(--border)] rounded px-1 text-center text-sm font-bold"
                    placeholder="0"
                  />
                  <span className="text-xs text-[var(--muted)]">-</span>
                  <input
                    type="number"
                    min="0"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    className="w-10 bg-[var(--bg)] border border-[var(--border)] rounded px-1 text-center text-sm font-bold"
                    placeholder="0"
                  />
                  <button
                    onClick={() => handleSave(f.id)}
                    disabled={saving || !homeScore || !awayScore}
                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-1 text-xs text-[var(--muted)]"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 text-xs font-semibold">
                    {f.home_team} vs {f.away_team}
                  </div>
                  <button
                    onClick={() => {
                      setEditingId(f.id);
                      setHomeScore("");
                      setAwayScore("");
                    }}
                    className="px-2 py-1 text-xs bg-[var(--card-3)] rounded hover:bg-[var(--gold)] hover:text-black transition"
                  >
                    Add Score
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-green-400">
          ✓ All finished matches have scores!
        </div>
      )}
    </div>
  );
}
