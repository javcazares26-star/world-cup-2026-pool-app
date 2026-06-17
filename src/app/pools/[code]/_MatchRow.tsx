"use client";
import type { Fixture, Pick } from "@/lib/types";
import { useEffect, useState } from "react";
import { formatDualTime } from "@/lib/timezones";
import { getTeamFlag } from "@/lib/team-flags";

type Props = {
  fixture: Fixture;
  pick?: Pick;
  showActual?: boolean;
  showScore?: boolean;
  userLocation: string | null;
  onSave: (fixtureId: number, home: number, away: number) => void;
  isAdmin?: boolean;
};

const DEFAULT_LOCK_LEAD_MS = 2 * 60 * 60 * 1000; // picks lock 2 hours before kickoff
const CANADA_BOSNIA_LOCK_MS = 30 * 60 * 1000; // Canada vs Bosnia: lock 30 mins before

function getLockLeadMs(fixture: Fixture): number {
  // Special case: Canada vs Bosnia locks only 30 mins before
  const isCanadaBosnia =
    (fixture.home_team === 'Canada' && fixture.away_team?.includes('Bosnia')) ||
    (fixture.away_team === 'Canada' && fixture.home_team?.includes('Bosnia'));
  return isCanadaBosnia ? CANADA_BOSNIA_LOCK_MS : DEFAULT_LOCK_LEAD_MS;
}

export function MatchRow({ fixture, pick, showActual, showScore, userLocation, onSave, isAdmin }: Props) {
  const [home, setHome] = useState(pick?.home_pick ?? 0);
  const [away, setAway] = useState(pick?.away_pick ?? 0);
  const [saved, setSaved] = useState(false);
  const [editingScore, setEditingScore] = useState(false);
  const [editHome, setEditHome] = useState(fixture.home_score?.toString() ?? "");
  const [editAway, setEditAway] = useState(fixture.away_score?.toString() ?? "");
  const [savingScore, setSavingScore] = useState(false);
  // Tick re-renders the row frequently to keep countdown accurate
  // Updates every 1 second when within 10 minutes of lock, every 15s otherwise
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (pick) { setHome(pick.home_pick); setAway(pick.away_pick); }
  }, [pick]);

  const saveActualScore = async () => {
    setSavingScore(true);
    const supabase = (await import("@/lib/supabase/client")).createClient();
    await supabase
      .from("fixtures")
      .update({ home_score: parseInt(editHome || "0"), away_score: parseInt(editAway || "0") })
      .eq("id", fixture.id);
    setSavingScore(false);
    setEditingScore(false);
  };

  const lockLeadMs = getLockLeadMs(fixture);

  useEffect(() => {
    const ko = new Date(fixture.kickoff_utc);
    const koMs = ko.getTime();
    const lockTime = koMs - lockLeadMs;
    const msUntilLock = lockTime - Date.now();

    // Update frequently when close to lock time, less frequently otherwise
    const interval = msUntilLock < 10 * 60 * 1000 ? 1000 : 15000;

    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [fixture.kickoff_utc, lockLeadMs]);

  // Parse kickoff time accurately
  const ko = new Date(fixture.kickoff_utc);
  if (isNaN(ko.getTime())) {
    console.warn(`Invalid kickoff time for fixture ${fixture.id}: ${fixture.kickoff_utc}`);
  }

  const koMs = ko.getTime();
  const lockTimeMs = koMs - lockLeadMs; // Time when picks should lock
  const msUntilLock = lockTimeMs - now;

  const isLive = ["1H","2H","ET","LIVE","HT","BT","P"].includes(fixture.status_short ?? "");
  const isFinal = ["FT","AET","PEN"].includes(fixture.status_short ?? "");
  const isLockedByTime = msUntilLock <= 0 && !isLive && !isFinal; // Don't lock if already live/final
  const locked = pick?.locked || (fixture.status_short && fixture.status_short !== "NS") || isLockedByTime;

  // Show a countdown only when within 30 minutes of the lock cutoff
  const showCountdown = !locked && msUntilLock > 0 && msUntilLock < 30 * 60 * 1000;
  const countdownLabel = showCountdown ? formatCountdown(msUntilLock) : null;

  function bump(side: "h"|"a", d: number) {
    if (locked) return;
    const setter = side === "h" ? setHome : setAway;
    const cur = side === "h" ? home : away;
    const next = Math.max(0, Math.min(20, cur + d));
    setter(next);
    onSave(fixture.id, side === "h" ? next : home, side === "a" ? next : away);
    setSaved(true);
    setTimeout(() => setSaved(false), 800);
  }

  // Compute points for this fixture (mirrors v_pick_scores)
  let pointsLabel: string | null = null;
  let pointsClass = "";
  if (isFinal && pick) {
    if (pick.home_pick === fixture.home_score && pick.away_pick === fixture.away_score) {
      pointsLabel = "+3 EXACT"; pointsClass = "bg-[var(--pitch-light)] text-[#0a1a14]";
    } else if (Math.sign(pick.home_pick - pick.away_pick) === Math.sign((fixture.home_score ?? 0) - (fixture.away_score ?? 0))) {
      pointsLabel = "+1"; pointsClass = "bg-[var(--gold)] text-[#2a2200]";
    } else {
      pointsLabel = "0"; pointsClass = "bg-[var(--card-2)] text-[var(--muted)]";
    }
  }

  const isKnockout = !fixture.group_label;

  return (
    <div className={"px-4 py-3 border-b border-[var(--border)] last:border-b-0 " + (isLive ? "bg-[rgba(193,26,54,0.05)]" : "")}>
      <div className="flex justify-between items-center text-[10px] text-[var(--muted)] mb-1">
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-wider">
            {fixture.group_label ?? fixture.round}
          </span>
          {isKnockout && fixture.match_id && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--card-2)] font-bold text-[var(--gold)]">
              {fixture.match_id}
            </span>
          )}
        </div>
        {isLive ? (
          <span className="broadcast-live">{fixture.minute != null ? `${fixture.minute}'` : ""} LIVE</span>
        ) : isFinal ? (
          <span className="text-[var(--pitch-light)] font-bold tracking-widest">FT</span>
        ) : isLockedByTime ? (
          <span className="text-[var(--crimson)] font-bold tracking-widest">🔒 LOCKED</span>
        ) : countdownLabel ? (
          <span className="text-[var(--crimson)] font-bold">⏱ Locks in {countdownLabel}</span>
        ) : (
          <span className="text-xs">{formatDualTime(fixture.kickoff_utc, fixture.city, userLocation)}</span>
        )}
      </div>
      {isKnockout && (fixture.qualified_team_home || fixture.qualified_team_away) && (
        <div className="text-[9px] text-[var(--muted)] mb-2 tracking-wide">
          {fixture.qualified_team_home ?? "?"} vs {fixture.qualified_team_away ?? "?"}
        </div>
      )}
      <div className={showScore ? "space-y-2" : ""}>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
          <div className="flex items-center gap-2 min-w-0">
            {fixture.home_logo && <img src={fixture.home_logo} alt="" className="w-6 h-6" />}
            <span className="text-lg">{getTeamFlag(fixture.home_team)}</span>
            <span className="font-medium text-sm truncate">{fixture.home_team}</span>
          </div>
          <div className="flex items-center gap-1 bg-[var(--bg-2)] border border-[var(--border)] rounded-lg p-1">
            <div className="flex flex-col">
              <button onClick={() => bump("h", 1)} disabled={!!locked} className="bg-[var(--card-2)] text-xs w-6 h-4 rounded hover:bg-[var(--crimson)] disabled:opacity-40">▲</button>
              <button onClick={() => bump("h", -1)} disabled={!!locked} className="bg-[var(--card-2)] text-xs w-6 h-4 rounded hover:bg-[var(--crimson)] disabled:opacity-40 mt-px">▼</button>
            </div>
            <input
              type="number" min={0} max={20} value={home}
              disabled={!!locked}
              onChange={(e) => {
                const v = Math.max(0, Math.min(20, parseInt(e.target.value || "0", 10)));
                setHome(v); onSave(fixture.id, v, away);
              }}
              className="w-10 h-8 bg-transparent text-center font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-xs text-[var(--muted)]">vs</span>
            <input
              type="number" min={0} max={20} value={away}
              disabled={!!locked}
              onChange={(e) => {
                const v = Math.max(0, Math.min(20, parseInt(e.target.value || "0", 10)));
                setAway(v); onSave(fixture.id, home, v);
              }}
              className="w-10 h-8 bg-transparent text-center font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div className="flex flex-col">
              <button onClick={() => bump("a", 1)} disabled={!!locked} className="bg-[var(--card-2)] text-xs w-6 h-4 rounded hover:bg-[var(--crimson)] disabled:opacity-40">▲</button>
              <button onClick={() => bump("a", -1)} disabled={!!locked} className="bg-[var(--card-2)] text-xs w-6 h-4 rounded hover:bg-[var(--crimson)] disabled:opacity-40 mt-px">▼</button>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end min-w-0">
            <span className="font-medium text-sm truncate text-right">{fixture.away_team}</span>
            <span className="text-lg">{getTeamFlag(fixture.away_team)}</span>
            {fixture.away_logo && <img src={fixture.away_logo} alt="" className="w-6 h-6" />}
          </div>
        </div>

        {/* Show actual score for finished matches */}
        {isFinal && (fixture.home_score !== null || fixture.away_score !== null) && (
          <div className="bg-[var(--bg-2)] rounded p-2 mt-2 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">
                Final Score
              </div>
              {isAdmin && !editingScore && (
                <button
                  onClick={() => {
                    setEditingScore(true);
                    setEditHome(fixture.home_score?.toString() ?? "");
                    setEditAway(fixture.away_score?.toString() ?? "");
                  }}
                  className="text-xs px-2 py-1 rounded bg-[var(--card-3)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-black transition"
                >
                  ✎ Edit
                </button>
              )}
            </div>
            {editingScore ? (
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  min="0"
                  value={editHome}
                  onChange={(e) => setEditHome(e.target.value)}
                  className="w-12 bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-center font-bold"
                />
                <span className="text-xs">-</span>
                <input
                  type="number"
                  min="0"
                  value={editAway}
                  onChange={(e) => setEditAway(e.target.value)}
                  className="w-12 bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-center font-bold"
                />
                <button
                  onClick={saveActualScore}
                  disabled={savingScore}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {savingScore ? "..." : "Save"}
                </button>
                <button
                  onClick={() => setEditingScore(false)}
                  className="text-xs text-[var(--muted)]"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center text-sm font-bold">
                <span>{fixture.home_team}</span>
                <span className="px-3 py-1 bg-[var(--card-2)] rounded">{fixture.home_score} - {fixture.away_score}</span>
                <span>{fixture.away_team}</span>
              </div>
            )}
            {/* Show points earned */}
            {!editingScore && (
              <div className="mt-2 text-xs text-center">
                {pick && (
                  (() => {
                    if (pick.home_pick === fixture.home_score && pick.away_pick === fixture.away_score) {
                      return <span className="text-[var(--pitch-light)] font-bold">✅ Exact Match! +3 points</span>;
                    }
                    if (Math.sign(pick.home_pick - pick.away_pick) === Math.sign((fixture.home_score ?? 0) - (fixture.away_score ?? 0))) {
                      return <span className="text-[var(--gold)] font-bold">⭐ Correct Outcome! +1 point</span>;
                    }
                    return <span className="text-[var(--crimson)]">❌ No points</span>;
                  })()
                )}
              </div>
            )}
          </div>
        )}

        {/* Real-time score display side-by-side with picks */}
        {showScore && !isFinal && (fixture.home_score !== null || fixture.away_score !== null) && (
          <div className="flex justify-between items-center px-1 text-xs">
            <div className="text-[var(--muted)]">
              Your pick: <span className="font-bold text-white">{home} vs {away}</span>
            </div>
            <div className="text-right">
              <span className="text-[var(--muted)]">Actual: </span>
              <span className={`font-bold ${isLive ? "text-[var(--crimson)]" : isFinal ? "text-[var(--pitch-light)]" : "text-white"}`}>
                {fixture.home_score ?? "–"} vs {fixture.away_score ?? "–"}
              </span>
              {pointsLabel && <span className={"ml-2 px-2 py-0.5 rounded-full font-bold text-[10px] " + pointsClass}>{pointsLabel}</span>}
            </div>
          </div>
        )}

        {/* Original score display for other cases */}
        {!showScore && (showActual || isFinal || isLive) && (fixture.home_score !== null) && (
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-[var(--border)] text-xs">
            <span className="text-[var(--muted)]">
              Score:&nbsp;
              <span className="scoreboard gold text-base">
                {fixture.home_score} – {fixture.away_score}
              </span>
            </span>
            {pointsLabel && <span className={"px-2 py-0.5 rounded-full font-bold text-[11px] " + pointsClass}>{pointsLabel}</span>}
          </div>
        )}
      </div>
      {saved && !locked && <div className="text-[10px] text-[var(--pitch-light)] mt-1">✓ Saved</div>}
    </div>
  );
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return `${h}h ${rem}m`;
  }
  if (m >= 5) return `${m}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}
