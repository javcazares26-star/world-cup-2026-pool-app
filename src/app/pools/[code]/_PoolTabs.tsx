"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Fixture, Pick, Pool, LeaderboardRow } from "@/lib/types";
import { MatchRow } from "./_MatchRow";
import { Leaderboard } from "./_Leaderboard";
import { Kpis } from "./_Kpis";
import { FairPlay } from "./_FairPlay";
import { Admin, type Member, type OwnedPoolRef } from "./_Admin";
import { Members } from "./_Members";
import { ThirdPlaceStandings } from "./_3rdPlaceStandings";
import { WinnerPick } from "./_WinnerPick";
import { AdminPicks } from "./_AdminPicks";
import type { Message } from "@/lib/types";

export type { Member, OwnedPoolRef } from "./_Admin";

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
};

export function PoolTabs({ pool, userId, fixtures: initialFixtures, myPicks: initialPicks, leaderboard: initialLb, messages: initialMessages, members: initialMembers, ownedPools, initialTab }: Props) {
  const isOwner = pool.owner_id === userId;
  const [tab, setTab] = useState(initialTab);
  const [picksStage, setPicksStage] = useState<"groups" | "knockout">("groups");
  const [fixtures, setFixtures] = useState(initialFixtures);
  const [picks, setPicks] = useState(initialPicks);
  const [leaderboard, setLeaderboard] = useState(initialLb);
  const [poolAdminHidden, setPoolAdminHidden] = useState(pool.admin_hidden);
  const [allPicks, setAllPicks] = useState<any[]>([]);

  // Get current user's location for timezone display
  const myMember = initialMembers.find(m => m.user_id === userId);
  const myLocation = myMember?.location ?? null;

  // ====== ADMIN: Fetch all pool picks for search ======
  useEffect(() => {
    if (!isOwner || tab !== "admin-picks") return;

    const supabase = createClient();
    (async () => {
      const { data, error } = await supabase
        .from("picks")
        .select("*")
        .eq("pool_id", pool.id);

      if (!error && data) {
        setAllPicks(data);
      }
    })();
  }, [isOwner, tab, pool.id]);

  // ====== REALTIME: listen for pool updates (admin_hidden toggle) ======
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel("pool-changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pools" }, (payload) => {
        if ((payload.new as any).id === pool.id) {
          setPoolAdminHidden((payload.new as any).admin_hidden);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [pool.id]);

  // ====== REALTIME: listen for fixture updates (live scores) ======
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel("fixtures-changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "fixtures" }, (payload) => {
        setFixtures(prev => prev.map(f => f.id === (payload.new as any).id ? (payload.new as Fixture) : f));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "fixtures" }, (payload) => {
        setFixtures(prev => [...prev, payload.new as Fixture]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // NOTE: Real-time leaderboard updates are now handled in _PoolLayout.tsx
  // to avoid duplicate subscriptions to the same channel

  // ====== Group fixtures — separate by stage ======
  const groupStageFixtures = useMemo(() => fixtures.filter(f => f.group_label), [fixtures]);
  const eliminationFixtures = useMemo(() => fixtures.filter(f => !f.group_label), [fixtures]);

  // Group fixtures by label (Groups) or round (Elimination)
  const groupedByStage = useMemo(() => {
    const groups: Record<string, Fixture[]> = {};
    const elim: Record<string, Fixture[]> = {};

    groupStageFixtures.forEach(f => {
      const key = f.group_label || "Other";
      (groups[key] ??= []).push(f);
    });

    eliminationFixtures.forEach(f => {
      const key = f.round || "Knockout";
      (elim[key] ??= []).push(f);
    });

    return { groups, elim };
  }, [groupStageFixtures, eliminationFixtures]);

  const liveCount = fixtures.filter(f => f.status_short === "1H" || f.status_short === "2H" || f.status_short === "LIVE").length;

  // ====== Compute points client-side for KPIs (mirrors v_pick_scores) ======
  const myStats = useMemo(() => {
    let points = 0, exact = 0;
    picks.forEach(p => {
      const f = fixtures.find(x => x.id === p.fixture_id);
      if (!f || (f.status_short !== "FT" && f.status_short !== "AET" && f.status_short !== "PEN")) return;
      if (p.home_pick === f.home_score && p.away_pick === f.away_score) { points += 3; exact++; }
      else if (Math.sign(p.home_pick - p.away_pick) === Math.sign((f.home_score ?? 0) - (f.away_score ?? 0))) points += 1;
    });
    return { points, exact, picks: picks.length };
  }, [picks, fixtures]);

  const myRank = useMemo(() => {
    const idx = leaderboard.findIndex(r => r.user_id === userId);
    return idx >= 0 ? idx + 1 : null;
  }, [leaderboard, userId]);

  async function upsertPick(fixtureId: number, home: number, away: number) {
    const supabase = createClient();
    const existing = picks.find(p => p.fixture_id === fixtureId);
    // Optimistic update
    if (existing) {
      setPicks(prev => prev.map(p => p.fixture_id === fixtureId ? { ...p, home_pick: home, away_pick: away } : p));
    } else {
      setPicks(prev => [...prev, { id: "tmp", user_id: userId, pool_id: pool.id, fixture_id: fixtureId, home_pick: home, away_pick: away, locked: false }]);
    }
    const { error } = await supabase.from("picks").upsert(
      { user_id: userId, pool_id: pool.id, fixture_id: fixtureId, home_pick: home, away_pick: away },
      { onConflict: "user_id,pool_id,fixture_id" }
    );
    if (error) console.error(error);
  }

  return (
    <>
      <Kpis stats={myStats} rank={myRank} live={liveCount} />

      <nav className="card !p-1.5 flex gap-1 my-4 overflow-x-auto">
        {([
          ["winner", "🏆 Winner"],
          ["picks", "📝 Picks"],
          ["fairplay", "📊 Groups Live"],
          ["members", "👥 Members"],
          ["leaderboard", "🥇 Leaderboard"],
          ...(isOwner ? [["admin-picks", "🔍 All Picks"], ["admin", "⚙️ Admin"]] : []),
        ] as [string, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={"px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-1 min-w-max " +
              (tab === id
                ? "bg-gradient-to-r from-[var(--crimson)] to-[var(--gold)] text-[#1a1a1a]"
                : "text-[var(--muted)] hover:text-[var(--text)]")}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "winner" && (
        <WinnerPick pool={pool} userId={userId} fixtures={fixtures} />
      )}

      {tab === "picks" && (
        <>
          <div className="card mb-4 border-l-4" style={{ borderLeftColor: "var(--crimson)" }}>
            <h3 className="font-bold text-sm flex items-center gap-2">
              🔒 Pool rule — picks lock 5 minutes before kickoff
            </h3>
            <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
              Predictions can be updated freely until <strong>5 minutes before each match's kickoff time</strong>. Once locked, that match's pick is final — no changes, no exceptions. See your picks and live scores in the same place.
            </p>
          </div>

            {/* STAGE TOGGLE */}
            <div className="card !p-2 flex gap-2 mb-4">
              <button
                onClick={() => setPicksStage("groups")}
                className={"px-4 py-2 rounded-lg text-sm font-semibold transition-colors " +
                  (picksStage === "groups"
                    ? "bg-[var(--gold)] text-[#1a1a1a]"
                    : "bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)]")}
              >
                📋 Groups Stage
              </button>
              <button
                onClick={() => setPicksStage("knockout")}
                className={"px-4 py-2 rounded-lg text-sm font-semibold transition-colors " +
                  (picksStage === "knockout"
                    ? "bg-[var(--gold)] text-[#1a1a1a]"
                    : "bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)]")}
              >
                🏆 Knockout Stage
              </button>
            </div>

            {/* GROUPS STAGE SECTION */}
            {picksStage === "groups" && (
            <div className="mb-6">
            <h2 className="text-lg font-bold text-[var(--gold)] mb-4 flex items-center gap-2">
              📋 Groups Stage
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(groupedByStage.groups).map(([group, ms]) => (
              <div key={group} className="card !p-0 overflow-hidden">
                <div className="group-banner px-4 py-3 border-b border-[var(--border)] text-xs text-[var(--gold)]">
                  {group}
                </div>
                {ms.map(m => (
                  <MatchRow key={m.id} fixture={m} pick={picks.find(p => p.fixture_id === m.id)} onSave={upsertPick} showScore userLocation={myLocation} />
                ))}
              </div>
            ))}
              {groupStageFixtures.length === 0 && (
                <div className="card col-span-2 text-center">
                  <p className="text-[var(--muted)]">Group stage fixtures haven't synced yet. The cron will populate them within 5 minutes after deploy.</p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* KNOCKOUT STAGE SECTION */}
          {picksStage === "knockout" && (
          <div>
            <h2 className="text-lg font-bold text-[var(--gold)] mb-4 flex items-center gap-2">
              🏆 Knockout Stage
            </h2>

            {/* 3rd Place Standings */}
            <div className="mb-6">
              <ThirdPlaceStandings fixtures={fixtures} picks={picks} />
            </div>

            <div className="space-y-4">
              {Object.entries(groupedByStage.elim)
                .sort(([a], [b]) => {
                  const order = ["Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "3RD PLACE FINAL", "3rd Place Final", "Final"];
                  const aIdx = order.findIndex(o => o.toUpperCase() === (a ?? "").toUpperCase());
                  const bIdx = order.findIndex(o => o.toUpperCase() === (b ?? "").toUpperCase());
                  return (aIdx >= 0 ? aIdx : 999) - (bIdx >= 0 ? bIdx : 999);
                })
                .map(([round, ms]) => (
                <div key={round} className="card !p-0 overflow-hidden">
                  <div className="group-banner px-4 py-3 border-b border-[var(--border)] text-xs text-[var(--gold)]">
                    {round}
                  </div>
                  <div className="space-y-0">
                    {ms.sort((a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime())
                      .map(m => (
                      <MatchRow key={m.id} fixture={m} pick={picks.find(p => p.fixture_id === m.id)} onSave={upsertPick} showScore userLocation={myLocation} />
                    ))}
                  </div>
                </div>
              ))}
              {eliminationFixtures.length === 0 && (
                <div className="card text-center">
                  <p className="text-[var(--muted)]">Knockout fixtures will appear after the group stage. Check back when they're available!</p>
                </div>
              )}
            </div>
          </div>
          )}
        </>
      )}

      {tab === "fairplay" && (
        <FairPlay fixtures={fixtures} picks={picks} />
      )}

      {tab === "members" && (
        <Members userId={userId} members={initialMembers} pool={{ ...pool, admin_hidden: poolAdminHidden }} />
      )}

      {tab === "leaderboard" && (
        <Leaderboard rows={leaderboard} meId={userId} pool={{ ...pool, admin_hidden: poolAdminHidden }} />
      )}

      {tab === "admin-picks" && isOwner && (
        <AdminPicks fixtures={fixtures} picks={picks} members={initialMembers} allPicks={allPicks} />
      )}

      {tab === "admin" && isOwner && (
        <Admin pool={pool} userId={userId} members={initialMembers} ownedPools={ownedPools} />
      )}
    </>
  );
}
