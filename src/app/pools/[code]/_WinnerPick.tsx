"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Fixture, Pool } from "@/lib/types";

type Props = {
  pool: Pool;
  userId: string;
  fixtures: Fixture[];
};

type WinnerPick = {
  team_name: string;
  locked_at: string | null;
  points_awarded: number;
};

export function WinnerPick({ pool, userId, fixtures }: Props) {
  const [myPick, setMyPick] = useState<WinnerPick | null>(null);
  const [timeUntilLock, setTimeUntilLock] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [hasChangedDuringGroupStage, setHasChangedDuringGroupStage] = useState(false);

  // Extract all unique teams from fixtures, filtering out placeholder codes
  const allTeams = useMemo(() => {
    const teams = new Set<string>();
    fixtures.forEach(f => {
      if (f.home_team) teams.add(f.home_team);
      if (f.away_team) teams.add(f.away_team);
    });

    // Filter out placeholder codes (TBD, RU###, W###, etc.)
    const filteredTeams = Array.from(teams).filter(team => {
      // Exclude "TBD" and codes that are purely numeric or coded placeholders
      if (team === "TBD") return false;
      if (/^RU\d+$/.test(team)) return false; // Matches RU101, RU102, etc.
      if (/^W\d+$/.test(team)) return false; // Matches W73, W101, etc.
      if (/^W[A-Z]$/.test(team)) return false; // Matches WA, WB (3rd place placeholders)
      return true;
    });

    return filteredTeams.sort();
  }, [fixtures]);

  // Calculate lock deadline: 5 mins before first knockout match (group stage ends)
  const groupStageLockDeadline = useMemo(() => {
    // Find first knockout match to determine when group stage ends
    const knockoutFixtures = fixtures
      // Real seeded knockout rows only — ignore leftover duplicate API rows that
      // were mislabeled is_knockout, which would otherwise place the lock in the past.
      .filter(f => f.is_knockout && f.id < 1000000)
      .sort((a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime());

    if (knockoutFixtures.length > 0) {
      const firstKnockout = new Date(knockoutFixtures[0].kickoff_utc);
      return new Date(firstKnockout.getTime() - 5 * 60000); // 5 mins before
    }

    // Fallback: June 27, 2026 (first Round of 16 matches)
    return new Date("2026-06-27T13:00:00Z");
  }, [fixtures]);

  // Load my pick from database
  useEffect(() => {
    const loadPick = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("tournament_winner_picks")
        .select("*")
        .eq("pool_id", pool.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        setMyPick({
          team_name: data.team_name,
          locked_at: data.locked_at,
          points_awarded: data.points_awarded,
        });
        setIsLocked(data.locked_at !== null);
      }
    };
    loadPick();
  }, [pool.id, userId]);

  // Countdown timer until lock (group stage ends)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const timeLeft = groupStageLockDeadline.getTime() - now.getTime();

      if (timeLeft <= 0) {
        setTimeUntilLock(0);
      } else {
        setTimeUntilLock(Math.floor(timeLeft / 1000)); // Convert to seconds
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [groupStageLockDeadline]);

  // Auto-lock when group stage ends
  useEffect(() => {
    const checkLockStatus = () => {
      const now = new Date();
      if (now >= groupStageLockDeadline && myPick && !myPick.locked_at) {
        setIsLocked(true);
        // Auto-lock in database
        const supabase = createClient();
        supabase
          .from("tournament_winner_picks")
          .update({ locked_at: new Date().toISOString() })
          .eq("pool_id", pool.id)
          .eq("user_id", userId)
          .then(() => {
            setMyPick(prev => prev ? { ...prev, locked_at: new Date().toISOString() } : null);
          });
      }
    };

    checkLockStatus();
    const interval = setInterval(checkLockStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [groupStageLockDeadline, myPick, pool.id, userId]);

  const handleTeamSelect = async (teamName: string) => {
    // Don't allow changes if locked
    if (isLocked) return;

    const supabase = createClient();
    const { error } = await supabase.from("tournament_winner_picks").upsert(
      {
        pool_id: pool.id,
        user_id: userId,
        team_name: teamName,
      },
      { onConflict: "pool_id,user_id" }
    );

    if (!error) {
      setMyPick(prev => ({
        ...prev || { locked_at: null, points_awarded: 0 },
        team_name: teamName,
      }));
      setHasChangedDuringGroupStage(true);
    }
  };

  const formatCountdown = (seconds: number | null) => {
    if (seconds === null) return "";
    if (seconds <= 0) return "LOCKED";

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="card mb-6 border-l-4" style={{ borderLeftColor: "var(--gold)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm flex items-center gap-2">
          🏆 World Cup Winner Pick
        </h3>
        <div className="flex items-center gap-3">
          {!isLocked && timeUntilLock !== null && (
            <div className="text-xs font-semibold text-[var(--gold)] bg-[var(--card-2)] px-3 py-1 rounded-full" title="Time until group stage ends and pick locks">
              ⏰ {formatCountdown(timeUntilLock)}
            </div>
          )}
          {isLocked && (
            <div className="text-xs font-semibold text-[var(--crimson)] bg-[var(--card-2)] px-3 py-1 rounded-full">
              🔒 LOCKED
            </div>
          )}
          {myPick?.points_awarded === 5 && (
            <div className="text-xs font-semibold text-green-500 bg-[var(--card-2)] px-3 py-1 rounded-full">
              ✓ +5 points!
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-[var(--muted)] mb-4 leading-relaxed">
        {isLocked
          ? "Your pick is locked. It cannot be changed after the group stage ends."
          : "Select one team to win the 2026 World Cup. Your pick locks after the group stage. Correct prediction = 5 points."}
      </p>

      {myPick?.team_name && (
        <div className="mb-4 p-3 bg-[var(--card-2)] rounded-lg border border-[var(--gold)]">
          <p className="text-xs text-[var(--muted)] mb-1">Your Pick:</p>
          <p className="font-bold text-[var(--gold)]">{myPick.team_name}</p>
        </div>
      )}

      {hasChangedDuringGroupStage && !isLocked && (
        <div className="mb-4 p-2 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-500">
          ✓ Pick updated. You can change it anytime during the group stage.
        </div>
      )}

      {/* Team selection grid */}
      <div className="grid grid-cols-4 gap-2">
        {allTeams.map(team => (
          <button
            key={team}
            onClick={() => handleTeamSelect(team)}
            disabled={isLocked}
            className={`p-2 rounded text-xs font-semibold text-center transition-all ${
              myPick?.team_name === team
                ? "bg-gradient-to-r from-[var(--crimson)] to-[var(--gold)] text-[#1a1a1a]"
                : isLocked
                ? "bg-[var(--card-2)] text-[var(--muted)] cursor-not-allowed"
                : "bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-3)]"
            }`}
          >
            {team}
          </button>
        ))}
      </div>
    </div>
  );
}
