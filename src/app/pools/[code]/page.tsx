import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { PoolLayout } from "./_PoolLayout";
import { ShareBar } from "./_ShareBar";

export const dynamic = "force-dynamic";

export default async function PoolPage({
  params, searchParams,
}: { params: { code: string }; searchParams: { tab?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/pools/${params.code}`);

  const code = params.code.toUpperCase();

  // Auto-join FIRST. The RPC is SECURITY DEFINER so it bypasses RLS to look
  // the pool up by code. If the pool exists, the caller is added as a member,
  // which makes the SELECT below visible to them under the pool RLS policy.
  // If the pool doesn't exist, the RPC raises an exception (caught here),
  // and the SELECT will return null → notFound().
  await supabase.rpc("join_pool_by_code", { pool_code: code });

  const { data: pool } = await supabase
    .from("pools").select("*").eq("code", code).maybeSingle();
  if (!pool) notFound();

  const [
    { data: fixtures },
    { data: myPicks },
    { data: leaderboard },
    { data: rawMessages },
    { data: rawMembers },
    { data: rawOwnedPools },
  ] = await Promise.all([
    supabase.from("fixtures").select("*").order("kickoff_utc"),
    supabase.from("picks").select("*").eq("pool_id", pool.id).eq("user_id", user.id),
    supabase.from("v_leaderboard").select("*").eq("pool_id", pool.id),
    supabase.from("messages")
      .select("id,pool_id,user_id,content,created_at,profiles(display_name,avatar_url)")
      .eq("pool_id", pool.id)
      .order("created_at", { ascending: true })
      .limit(200),
    supabase.from("pool_members")
      .select("user_id,role,joined_at,is_admin,profiles(display_name,avatar_url,location)")
      .eq("pool_id", pool.id)
      .order("joined_at"),
    supabase.from("pools")
      .select("id,code,name,created_at")
      .eq("owner_id", user.id)
      .order("created_at"),
  ]);

  const ownedPools = rawOwnedPools ?? [];

  // Flatten profile join into the Message shape the client expects
  const messages = (rawMessages ?? []).map((m: any) => ({
    id: m.id,
    pool_id: m.pool_id,
    user_id: m.user_id,
    content: m.content,
    created_at: m.created_at,
    display_name: m.profiles?.display_name,
    avatar_url: m.profiles?.avatar_url ?? null,
  }));

  // Flatten members for the Admin + Members tabs
  const members = (rawMembers ?? []).map((m: any) => ({
    user_id: m.user_id,
    role: m.role,
    joined_at: m.joined_at,
    is_admin: m.is_admin ?? false,
    display_name: m.profiles?.display_name ?? "Player",
    avatar_url: m.profiles?.avatar_url ?? null,
    location: m.profiles?.location ?? null,
  }));

  const tab = searchParams.tab ?? "knockout";

  return (
    <PoolLayout
      pool={pool}
      userId={user.id}
      fixtures={fixtures ?? []}
      myPicks={myPicks ?? []}
      leaderboard={leaderboard ?? []}
      messages={messages}
      members={members}
      ownedPools={ownedPools}
      initialTab={tab}
      header={
        <div className="p-4 sm:p-6 border-b border-[var(--border)]">
          <header className="flex justify-between items-start gap-4 flex-wrap max-w-5xl mx-auto">
            <div>
              <Link href="/pools" className="text-xs text-[var(--muted)] hover:text-white inline-flex items-center gap-1">
                ← Your pools
              </Link>
              <div className="flex items-baseline gap-3 mt-2 flex-wrap">
                <span className="text-3xl trophy-shine">🏆</span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{pool.name}</h1>
              </div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--muted)] mt-2 flex items-center gap-3">
                <span>Canada · México · USA 2026</span>
                <span className="text-[var(--border)]">|</span>
                <span>Invite code <span className="text-[var(--gold)] font-mono font-bold tracking-widest">{pool.code}</span></span>
              </div>
            </div>
            <ShareBar code={pool.code} name={pool.name} />
          </header>
        </div>
      }
    />
  );
}
