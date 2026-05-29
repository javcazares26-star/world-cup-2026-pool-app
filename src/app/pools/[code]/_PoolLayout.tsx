"use client";
import { useEffect, useState, useRef } from "react";
import type { Fixture, Pick, Pool, LeaderboardRow, Message } from "@/lib/types";
import { PoolTabs, type Member, type OwnedPoolRef } from "./_PoolTabs";
import { Chat } from "./_Chat";
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
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
  const [fixtures, setFixtures] = useState(initialFixtures);
  const { addNotification } = useNotification();

  // Track previous scores to detect new goals
  const [prevScores, setPrevScores] = useState<Record<number, { h: number; a: number }>>({});

  // Track previous leaderboard rank using ref (not state) to avoid causing re-subscriptions
  const prevRankRef = useRef<number | null>(null);

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
    const ch = supabase
      .channel(`picks-${pool.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "picks", filter: `pool_id=eq.${pool.id}` }, async () => {
        // Fetch updated leaderboard
        const { data } = await supabase.from("v_leaderboard").select("*").eq("pool_id", pool.id);
        if (data) {
          setLeaderboard(data);

          // Check if my rank changed
          const myNewRank = data.findIndex((r) => r.user_id === userId) + 1;
          if (prevRankRef.current && myNewRank !== prevRankRef.current) {
            const direction = myNewRank < prevRankRef.current ? "up" : "down";
            const emoji = direction === "up" ? "📈" : "📉";

            addNotification({
              type: "leaderboard",
              title: `${emoji} Leaderboard Update`,
              message: `You moved ${direction} to #${myNewRank}! ${data[myNewRank - 1]?.points || 0} points`,
              duration: 7000,
            });
          }
          prevRankRef.current = myNewRank;
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [pool.id, userId]);

  // Initialize previous rank ref
  useEffect(() => {
    const myRank = leaderboard.findIndex((r) => r.user_id === userId) + 1;
    prevRankRef.current = myRank || null;
  }, [leaderboard, userId]);

  return (
    <div className="flex flex-col h-screen bg-[var(--bg)]">
      {/* Header */}
      {header && <div className="flex-shrink-0">{header}</div>}

      {/* Main content + Chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 max-w-5xl mx-auto w-full">
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

        {/* Chat sidebar */}
        <div
          className={`
            fixed md:relative bottom-0 right-0 top-auto md:top-0 z-40
            transform transition-transform duration-300
            ${isChatOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-x-0"}
            w-full md:w-80 h-96 md:h-auto border-t md:border-t-0 md:border-l border-[var(--border)]
            bg-[var(--bg)] flex flex-col shadow-lg md:shadow-none
          `}
        >
        {/* Chat header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h3 className="font-bold text-sm flex items-center gap-2">
            💬 Pool Chat
          </h3>
          <button
            onClick={() => setIsChatOpen(false)}
            className="md:hidden text-[var(--muted)] hover:text-[var(--text)]"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        {/* Chat content */}
        <div className="flex-1 overflow-hidden">
          <Chat poolId={pool.id} userId={userId} initial={initialMessages} />
        </div>
      </div>

        {/* Mobile chat toggle button (only show when chat is closed on mobile) */}
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="md:hidden fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-gradient-to-r from-[var(--crimson)] to-[var(--gold)] text-white shadow-xl flex items-center justify-center font-bold text-xl hover:shadow-2xl transition-all hover:scale-110"
            aria-label="Open chat"
          >
            💬
          </button>
        )}
      </div>
    </div>
  );
}
