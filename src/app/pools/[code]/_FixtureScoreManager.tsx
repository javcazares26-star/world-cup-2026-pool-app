"use client";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Fixture } from "@/lib/types";

type Props = {
  fixtures: Fixture[];
  onScoresUpdated?: () => void;
};

export function FixtureScoreManager({ fixtures, onScoresUpdated }: Props) {
  const [fixturesWithoutScores, setFixturesWithoutScores] = useState<Fixture[]>([]);
  const [editingFixtureId, setEditingFixtureId] = useState<number | null>(null);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Find fixtures that are finished but don't have scores
  useEffect(() => {
    const finished = fixtures.filter(f =>
      (f.status_short === "FT" || f.status_short === "AET" || f.status_short === "PEN") &&
      (f.home_score === null || f.away_score === null)
    );
    setFixturesWithoutScores(finished);
  }, [fixtures]);

  const stats = useMemo(() => {
    const total = fixtures.length;
    const withScores = fixtures.filter(f => f.home_score !== null && f.away_score !== null).length;
    const finished = fixtures.filter(f => f.status_short === "FT" || f.status_short === "AET" || f.status_short === "PEN").length;
    const finishedWithoutScores = fixturesWithoutScores.length;

    return { total, withScores, finished, finishedWithoutScores };
  }, [fixtures, fixturesWithoutScores]);

  async function saveScore(fixtureId: number, home: number, away: number) {
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("fixtures")
      .update({ home_score: home, away_score: away })
      .eq("id", fixtureId);

    setSaving(false);

    if (error) {
      setMessage({ type: "error", text: `Failed to save: ${error.message}` });
      return;
    }

    const fixture = fixtures.find(f => f.id === fixtureId);
    setMessage({ type: "success", text: `✓ Saved ${fixture?.home_team} ${home}-${away} ${fixture?.away_team}` });
    setEditingFixtureId(null);
    setHomeScore("");
    setAwayScore("");
    onScoresUpdated?.();

    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  }

  function startEdit(fixture: Fixture) {
    setEditingFixtureId(fixture.id);
    setHomeScore(fixture.home_score?.toString() || "");
    setAwayScore(fixture.away_score?.toString() || "");
  }

  return (
    <div className="card">
      <h2 className="font-bold text-lg mb-1">📊 Fixture Score Manager</h2>
      <p className="text-sm text-[var(--muted)] mb-4">
        Manage match scores for finished games. Currently showing fixtures from API-Football.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-[var(--card-2)] rounded p-3 text-center">
          <div className="text-xs text-[var(--muted)]">Total</div>
          <div className="font-bold text-lg">{stats.total}</div>
        </div>
        <div className="bg-[var(--card-2)] rounded p-3 text-center">
          <div className="text-xs text-[var(--muted)]">With Scores</div>
          <div className="font-bold text-lg text-[var(--pitch-light)]">{stats.withScores}</div>
        </div>
        <div className="bg-[var(--card-2)] rounded p-3 text-center">
          <div className="text-xs text-[var(--muted)]">Finished</div>
          <div className="font-bold text-lg">{stats.finished}</div>
        </div>
        <div className="bg-[var(--card-2)] rounded p-3 text-center">
          <div className="text-xs text-[var(--muted)]">Missing Scores</div>
          <div className={`font-bold text-lg ${stats.finishedWithoutScores > 0 ? "text-[var(--crimson)]" : "text-[var(--pitch-light)]"}`}>
            {stats.finishedWithoutScores}
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded text-sm ${
          message.type === "success"
            ? "bg-green-500/10 text-green-400 border border-green-500/30"
            : "bg-red-500/10 text-red-400 border border-red-500/30"
        }`}>
          {message.text}
        </div>
      )}

      {/* Fixtures without scores */}
      {fixturesWithoutScores.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
            {fixturesWithoutScores.length} finished match{fixturesWithoutScores.length === 1 ? "" : "es"} missing scores
          </p>
          {fixturesWithoutScores.map(f => (
            <div key={f.id} className="flex items-center justify-between gap-2 p-3 bg-[var(--card-2)] rounded border border-[var(--border)]">
              {editingFixtureId === f.id ? (
                <>
                  <div className="text-sm font-semibold flex-1">
                    {f.home_team} vs {f.away_team}
                  </div>
                  <div className="flex gap-1 items-center">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={homeScore}
                      onChange={e => setHomeScore(e.target.value)}
                      className="w-12 bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-center font-semibold"
                      autoFocus
                    />
                    <span className="text-[var(--muted)]">-</span>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={awayScore}
                      onChange={e => setAwayScore(e.target.value)}
                      className="w-12 bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-center font-semibold"
                    />
                    <button
                      onClick={() => saveScore(f.id, parseInt(homeScore || "0"), parseInt(awayScore || "0"))}
                      disabled={saving || homeScore === "" || awayScore === ""}
                      className="ml-2 px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving ? "…" : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingFixtureId(null)}
                      className="px-2 py-1 text-[var(--muted)] hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-semibold flex-1">
                    {f.home_team} <span className="text-[var(--muted)]">vs</span> {f.away_team}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {new Date(f.kickoff_utc).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <button
                    onClick={() => startEdit(f)}
                    className="px-3 py-1 bg-[var(--card-3)] text-xs font-semibold rounded hover:bg-[var(--gold)] hover:text-[#1a1a1a] transition"
                  >
                    Add Score
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-[var(--muted)]">
          ✓ All finished matches have scores!
        </div>
      )}
    </div>
  );
}
