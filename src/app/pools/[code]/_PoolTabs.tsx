"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Fixture, Pick, Pool, LeaderboardRow } from "@/lib/types";
import { MatchRow } from "./_MatchRow";
import { Leaderboard } from "./_Leaderboard";
import { Kpis } from "./_Kpis";
import { FairPlay } from "./_FairPlay";
import { Chat } from "./_Chat";
import { Admin, type Member, type OwnedPoolRef } from "./_Admin";
import type { Message } from "@/lib/types";

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
  const [fixtures, setFixtures] = useState(initialFixtures);
  const [picks, setPicks] = useState(initialPicks);
  const [leaderboard, setLeaderboard] = useState(initialLb);

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

  // ====== REALTIME: refresh leaderboard when any pick changes in our pool ======
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`picks-${pool.id}`)
      .on("postgres_changes",
          { event: "*", schema: "public", table: "picks", filter: `pool_id=eq.${pool.id}` },
          async () => {
            const { data } = await supabase.from("v_leaderboard").select("*").eq("pool_id", pool.id);
            if (data) setLeaderboard(data);
          })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [pool.id]);

  // ====== Group fixtures ======
  const grouped = useMemo(() => {
    const out: Record<string, Fixture[]> = {};
    fixtures.forEach(f => {
      const key = f.group_label || f.round || "Knockout";
      (out[key] ??= []).push(f);
    });
    return out;
  }, [fixtures]);

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
          ["picks", "📝 Picks"],
          ["live", "📺 Live"],
          ["fairplay", "📊 FairPlay"],
          ["leaderboard", "🥇 Leaderboard"],
          ["chat", "💬 Chat"],
          ...(isOwner ? [["admin", "⚙️ Admin"]] : []),
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

      {tab === "picks" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(grouped).map(([group, ms]) => (
            <div key={group} className="card !p-0 overflow-hidden">
              <div className="group-banner px-4 py-3 border-b border-[var(--border)] text-xs text-[var(--gold)]">
                {group}
              </div>
              {ms.map(m => (
                <MatchRow key={m.id} fixture={m} pick={picks.find(p => p.fixture_id === m.id)} onSave={upsertPick} />
              ))}
            </div>
          ))}
          {fixtures.length === 0 && (
            <div className="card col-span-2 text-center">
              <p className="text-[var(--muted)]">Fixtures haven't synced yet. The cron will populate them within 5 minutes after deploy. You can also hit <code>/api/cron/sync-fixtures?secret=…&amp;mode=full</code> manually.</p>
            </div>
          )}
        </div>
      )}

      {tab === "live" && (
        <div className="grid gap-3">
          {fixtures.filter(f => f.status_short !== "NS").sort((a,b) =>
            new Date(b.kickoff_utc).getTime() - new Date(a.kickoff_utc).getTime()
          ).map(m => (
            <div key={m.id} className="card !p-0 overflow-hidden">
              <MatchRow fixture={m} pick={picks.find(p => p.fixture_id === m.id)} onSave={upsertPick} showActual />
            </div>
          ))}
          {fixtures.every(f => f.status_short === "NS") && (
            <div className="card text-center text-[var(--muted)]">Nothing live yet. Check back during match windows.</div>
          )}
        </div>
      )}

      {tab === "fairplay" && (
        <FairPlay fixtures={fixtures} />
      )}

      {tab === "leaderboard" && (
        <Leaderboard rows={leaderboard} meId={userId} />
      )}

      {tab === "chat" && (
        <Chat poolId={pool.id} userId={userId} initial={initialMessages} />
      )}

      {tab === "admin" && isOwner && (
        <Admin pool={pool} userId={userId} members={initialMembers} ownedPools={ownedPools} />
      )}
    </>
  );
}
