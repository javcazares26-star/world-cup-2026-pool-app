"use client";
import { useState, useMemo } from "react";
import type { Fixture } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

type Props = {
  fixtures: Fixture[];
  onFixturesUpdated: () => void;
};

type FixtureEdit = {
  id: number;
  homeScore: number;
  awayScore: number;
  status: string;
  kickoff?: string; // datetime-local value (admin's local time); only set when edited
};

// Convert a stored UTC ISO string into a "YYYY-MM-DDTHH:mm" value for a
// datetime-local input, expressed in the admin's local timezone.
function toLocalInputValue(utcIso: string): string {
  const d = new Date(utcIso);
  if (isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export function FixtureManager({ fixtures, onFixturesUpdated }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [edits, setEdits] = useState<Record<number, FixtureEdit>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Filter fixtures by search and status
  const filteredFixtures = useMemo(() => {
    return fixtures.filter(f => {
      const matchesSearch = searchTerm === "" ||
        f.home_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.away_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.group_label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.round?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "all" || f.status_short === filterStatus;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime());
  }, [fixtures, searchTerm, filterStatus]);

  const updateFixture = (fixtureId: number, field: keyof FixtureEdit, value: string | number) => {
    const fixture = fixtures.find(f => f.id === fixtureId);
    if (!fixture) return;

    setEdits(prev => {
      const current = prev[fixtureId] || {
        id: fixtureId,
        homeScore: fixture.home_score ?? 0,
        awayScore: fixture.away_score ?? 0,
        status: fixture.status_short,
      };

      if (field === "homeScore") {
        current.homeScore = typeof value === "string" ? parseInt(value || "0", 10) : value;
      } else if (field === "awayScore") {
        current.awayScore = typeof value === "string" ? parseInt(value || "0", 10) : value;
      } else if (field === "status") {
        current.status = value as string;
      } else if (field === "kickoff") {
        current.kickoff = value as string;
      }

      return { ...prev, [fixtureId]: current };
    });
  };

  const getDisplayValue = (fixture: Fixture, field: "homeScore" | "awayScore" | "status"): string | number => {
    const edit = edits[fixture.id];
    if (!edit) {
      if (field === "homeScore") return fixture.home_score ?? 0;
      if (field === "awayScore") return fixture.away_score ?? 0;
      return fixture.status_short ?? "";
    }

    if (field === "homeScore") return edit.homeScore;
    if (field === "awayScore") return edit.awayScore;
    return edit.status;
  };

  const saveAllChanges = async () => {
    if (Object.keys(edits).length === 0) {
      setMessage("❌ No changes to save");
      return;
    }

    setSaving(true);
    setMessage(null);
    const supabase = createClient();

    try {
      const updates = Object.values(edits).map(edit =>
        supabase
          .from("fixtures")
          .update({
            home_score: edit.homeScore,
            away_score: edit.awayScore,
            status_short: edit.status,
            ...(edit.kickoff ? { kickoff_utc: new Date(edit.kickoff).toISOString() } : {}),
          })
          .eq("id", edit.id)
      );

      await Promise.all(updates);
      setMessage(`✅ ${Object.keys(edits).length} fixture(s) updated!`);
      setEdits({});
      setTimeout(() => {
        onFixturesUpdated();
        setMessage(null);
      }, 1500);
    } catch (err) {
      setMessage("❌ Error saving fixtures. Try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(edits).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-bold text-[var(--gold)]">🔧 Fixture Manager</h3>
        {message && (
          <span className={`text-sm font-semibold ${message.includes("✅") ? "text-green-400" : "text-red-400"}`}>
            {message}
          </span>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search team, group, or round..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 bg-[var(--card-2)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--gold)] outline-none"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-[var(--card-2)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:border-[var(--gold)] outline-none cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="NS">Not Started</option>
          <option value="1H">1st Half</option>
          <option value="2H">2nd Half</option>
          <option value="FT">Finished</option>
          <option value="AET">After Extra Time</option>
          <option value="PEN">Penalties</option>
        </select>
      </div>

      <p className="text-[11px] text-[var(--muted)]">
        Tip: edit scores, status, or <strong>kickoff time</strong> (shown in your local time), then Save. Kickoff changes update the schedule for everyone.
      </p>

      {/* Fixtures Table */}
      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--card-2)] border-b border-[var(--border)]">
              <th className="text-left p-3 font-semibold text-xs">Match</th>
              <th className="text-center p-3 font-semibold text-xs">Home Score</th>
              <th className="text-center p-3 font-semibold text-xs">Away Score</th>
              <th className="text-center p-3 font-semibold text-xs">Status</th>
              <th className="text-left p-3 font-semibold text-xs">Kickoff</th>
            </tr>
          </thead>
          <tbody>
            {filteredFixtures.map(fixture => {
              const isEdited = !!edits[fixture.id];
              const homeScore = Number(getDisplayValue(fixture, "homeScore"));
              const awayScore = Number(getDisplayValue(fixture, "awayScore"));
              const status = String(getDisplayValue(fixture, "status"));

              return (
                <tr
                  key={fixture.id}
                  className={`border-t border-[var(--border)] ${
                    isEdited ? "bg-[rgba(244,196,48,0.1)]" : ""
                  }`}
                >
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-[var(--muted)] font-semibold">
                        {fixture.group_label || fixture.round}
                      </span>
                      <span className="font-semibold text-sm">
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
                      onChange={(e) => updateFixture(fixture.id, "homeScore", e.target.value)}
                      className="w-12 bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-center font-bold text-sm hover:border-[var(--gold)] focus:border-[var(--gold)] outline-none"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={awayScore}
                      onChange={(e) => updateFixture(fixture.id, "awayScore", e.target.value)}
                      className="w-12 bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-center font-bold text-sm hover:border-[var(--gold)] focus:border-[var(--gold)] outline-none"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <select
                      value={status}
                      onChange={(e) => updateFixture(fixture.id, "status", e.target.value)}
                      className="w-16 bg-[var(--bg)] border border-[var(--border)] rounded px-1 py-1 text-center text-xs font-bold hover:border-[var(--gold)] focus:border-[var(--gold)] outline-none cursor-pointer"
                    >
                      <option value="NS">NS</option>
                      <option value="1H">1H</option>
                      <option value="2H">2H</option>
                      <option value="SUSP">SUSP (on hold)</option>
                      <option value="INT">INT (interrupted)</option>
                      <option value="FT">FT</option>
                      <option value="AET">AET</option>
                      <option value="PEN">PEN</option>
                    </select>
                  </td>
                  <td className="p-3 text-xs">
                    <input
                      type="datetime-local"
                      value={edits[fixture.id]?.kickoff ?? toLocalInputValue(fixture.kickoff_utc)}
                      onChange={(e) => updateFixture(fixture.id, "kickoff", e.target.value)}
                      className="bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text)] hover:border-[var(--gold)] focus:border-[var(--gold)] outline-none"
                      title="Set kickoff in your local time"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredFixtures.length === 0 && (
        <div className="card text-center p-4">
          <p className="text-[var(--muted)]">No fixtures match your search.</p>
        </div>
      )}

      {/* Save Button */}
      {hasChanges && (
        <div className="flex gap-3">
          <button
            onClick={saveAllChanges}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 disabled:opacity-50 transition"
          >
            {saving ? "Saving..." : `💾 Save ${Object.keys(edits).length} Change(s)`}
          </button>
          <button
            onClick={() => setEdits({})}
            className="px-6 py-2 bg-[var(--card-2)] text-[var(--muted)] font-semibold rounded hover:bg-[var(--card-3)] transition"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
