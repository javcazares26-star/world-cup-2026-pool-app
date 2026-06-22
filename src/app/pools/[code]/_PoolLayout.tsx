"use client";
import { useEffect, useState, useRef } from "react";
import type { Fixture, Pick, Pool, LeaderboardRow, Message } from "@/lib/types";
import { PoolTabs, type Member, type OwnedPoolRef } from "./_PoolTabs";
import { useNotification } from "@/components/NotificationContext";
import { createClient } from "@/lib/supabase/client";

type Props = {
  pool: Pool;
  userId: string;
  fixtures: Fixture[];
  myPicks: Pick[];
  leaderboard: LeaderboardRow[];
  messages: Message[];
  members: Member[];
  ownedPools: OwnedPoolRef[];
  initialTab: string;
  header?: React.ReactNode;
};

export function PoolLayout({
  pool,
  userId,
  fixtures: initialFixtures,
  myPicks,
  leaderboard: initialLeaderboard,
  messages: initialMessages,
  members,
  ownedPools,
  initialTab,
  header,
}: Props) {
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
  const [fixtures, setFixtures] = useState(initialFixtures);
  const { addNotification } = useNotification();

  // Track previous scores to detect new goals
  const [prevScores, setPrevScores] = useState<Record<number, { h: number; a: number }>>({});

  // Track previous leaderboard positions for all members using ref
  const prevLeaderboardRef = useRef<Record<string, { rank: number; points: number }>>({});

  // Track which fixtures we've already notified about picks locking
  const lockedNotificationsRef = useRef<Set<number>>(new Set());

  // ====== REALTIME: Goal scoring notifications ======
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel("fixture-goals")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "fixtures" }, (payload) => {
        const newFixture = payload.new as Fixture;
        const oldFixture = payload.old as Fixture;

        // Check if score changed
        if (
          newFixture.home_score !== oldFixture.home_score ||
          newFixture.away_score !== oldFixture.away_score
        ) {
          // Goal(s) detected!
          const homeScored = (newFixture.home_score ?? 0) > (oldFixture.home_score ?? 0);
          const awayScored = (newFixture.away_score ?? 0) > (oldFixture.away_score ?? 0);

          if (homeScored) {
            addNotification({
              type: "goal",
              title: `⚽ GOAL!`,
              message: `${newFixture.home_team} scores! ${newFixture.home_score}-${newFixture.away_score}`,
              duration: 5000,
            });
          }

          if (awayScored) {
            addNotification({
              type: "goal",
              title: `⚽ GOAL!`,
              message: `${newFixture.away_team} scores! ${newFixture.home_score}-${newFixture.away_score}`,
              duration: 5000,
            });
          }
        }

        // Update fixtures
        setFixtures((prev) =>
          prev.map((f) => (f.id === newFixture.id ? newFixture : f))
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [addNotification]);

  // ====== REALTIME: Leaderboard change notifications ======
  useEffect(() => {
    const supabase = createClient();

    async function updateLeaderboardAndNotify() {
      // Fetch updated leaderboard
      const { data } = await supabase.from("v_leaderboard").select("*").eq("pool_id", pool.id);
      if (data) {
        setLeaderboard(data);

        // Check all members for rank/points changes
        data.forEach((member, index) => {
          const currentRank = index + 1;
          const prevMember = prevLeaderboardRef.current[member.user_id];
          const prevRank = prevMember?.rank;

          // Notify if this is the first time we're seeing this rank (initialization)
          if (!prevMember) {
            prevLeaderboardRef.current[member.user_id] = { rank: currentRank, points: member.points };
            return;
          }

          // Check if rank changed
          if (prevRank && currentRank !== prevRank) {
            const direction = currentRank < prevRank ? "up" : "down";
            const positionChange = Math.abs(currentRank - prevRank);
            const emoji = direction === "up" ? "🚀" : "📉";

            addNotification({
              type: "leaderboard",
              title: `${emoji} ${member.display_name} moved ${direction}!`,
              message: `${member.display_name} has moved ${direction} to position #${currentRank} with ${member.points} points`,
              duration: 6000,
            });
          }

          // Notify if someone becomes #1
          if (currentRank === 1 && prevRank !== 1) {
            addNotification({
              type: "leaderboard",
              title: `👑 New Leader!`,
              message: `${member.display_name} is the new leaderboard leader! 🏆`,
              duration: 7000,
            });
          }

          // Update tracked position
          prevLeaderboardRef.current[member.user_id] = { rank: currentRank, points: member.points };
        });
      }
    }

    // Listen to picks changes
    const picksCh = supabase
      .channel(`picks-${pool.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "picks", filter: `pool_id=eq.${pool.id}` }, updateLeaderboardAndNotify)
      .subscribe();

    // Also listen to fixture updates (live scores AND final whistle).
    // Points are only credited once a match reaches a finished status
    // (FT/AET/PEN), and that transition often carries NO score change
    // (e.g. 2-1 at the 90th → 2-1 final), so we must also refresh when the
    // status flips to finished. Both group-stage and knockout matches count.
    const FINISHED_STATUSES = ["FT", "AET", "PEN"];
    const fixturesCh = supabase
      .channel("fixture-leaderboard-updates")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "fixtures" }, (payload) => {
        const newFixture = payload.new as Fixture;
        const oldFixture = payload.old as Fixture;

        const scoreChanged =
          newFixture.home_score !== oldFixture.home_score ||
          newFixture.away_score !== oldFixture.away_score;
        const justFinished =
          FINISHED_STATUSES.includes(newFixture.status_short || "") &&
          !FINISHED_STATUSES.includes(oldFixture.status_short || "");

        // Refresh standings whenever the result changes or a match ends —
        // for any match (group or knockout), since both award points.
        if (scoreChanged || justFinished) {
          updateLeaderboardAndNotify();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(picksCh);
      supabase.removeChannel(fixturesCh);
    };
  }, [pool.id, userId, addNotification]);

  // Initialize previous leaderboard positions
  useEffect(() => {
    const newState: Record<string, { rank: number; points: number }> = {};
    leaderboard.forEach((member, index) => {
      newState[member.user_id] = { rank: index + 1, points: member.points };
    });
    prevLeaderboardRef.current = newState;
  }, [leaderboard]);

  // ====== REALTIME: Picks lock notifications ======
  useEffect(() => {
    const supabase = createClient();

    const picksCh = supabase
      .channel(`picks-lock-${pool.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "picks", filter: `pool_id=eq.${pool.id}` }, async (payload) => {
        const newPick = payload.new as Pick;
        const oldPick = payload.old as Pick;

        // Only notify if locked changed from false to true
        if (!oldPick.locked && newPick.locked) {
          // Get the fixture details for this pick
          const fixture = fixtures.find(f => f.id === newPick.fixture_id);

          if (fixture && !lockedNotificationsRef.current.has(fixture.id)) {
            // Mark as notified to avoid duplicate notifications
            lockedNotificationsRef.current.add(fixture.id);

            addNotification({
              type: "lock",
              title: `🔒 Picks Locked!`,
              message: `Picks are now locked for ${fixture.home_team} vs ${fixture.away_team}`,
              duration: 6000,
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(picksCh);
    };
  }, [pool.id, fixtures, addNotification]);

  return (
    <div className="flex flex-col h-screen bg-[var(--bg)]">
      {/* Header */}
      {header && <div className="flex-shrink-0">{header}</div>}

      {/* Main content area */}
      <div data-scroll-container className="flex-1 overflow-y-auto px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <PoolTabs
          pool={pool}
          userId={userId}
          fixtures={fixtures}
          myPicks={myPicks}
          leaderboard={leaderboard}
          messages={initialMessages}
          members={members}
          ownedPools={ownedPools}
          initialTab={initialTab}
        />
      </div>
    </div>
  );
}
