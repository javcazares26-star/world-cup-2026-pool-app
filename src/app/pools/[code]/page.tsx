import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { PoolTabs } from "./_PoolTabs";
import { ShareBar } from "./_ShareBar";

export const dynamic = "force-dynamic";

export default async function PoolPage({
  params, searchParams,
}: { params: { code: string }; searchParams: { tab?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/pools/${params.code}`);

  const code = params.code.toUpperCase();

  const { data: pool } = await supabase
    .from("pools").select("*").eq("code", code).maybeSingle();
  if (!pool) notFound();

  // Auto-join if not a member yet (so a shareable URL just works).
  await supabase.rpc("join_pool_by_code", { pool_code: code });

  const [{ data: fixtures }, { data: myPicks }, { data: leaderboard }, { data: rawMessages }] = await Promise.all([
    supabase.from("fixtures").select("*").order("kickoff_utc"),
    supabase.from("picks").select("*").eq("pool_id", pool.id).eq("user_id", user.id),
    supabase.from("v_leaderboard").select("*").eq("pool_id", pool.id),
    supabase.from("messages")
      .select("id,pool_id,user_id,content,created_at,profiles(display_name,avatar_url)")
      .eq("pool_id", pool.id)
      .order("created_at", { ascending: true })
      .limit(200),
  ]);

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

  const tab = searchParams.tab ?? "picks";

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-6">
      <header className="flex justify-between items-start gap-4 flex-wrap mb-4">
        <div>
          <Link href="/pools" className="text-xs text-[#9aa3c7] hover:text-white">← Your pools</Link>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">{pool.name}</h1>
          <div className="text-xs text-[#9aa3c7] font-mono mt-1">
            Invite code: <span className="text-[#ffd23f]">{pool.code}</span>
          </div>
        </div>
        <ShareBar code={pool.code} name={pool.name} />
      </header>

      <PoolTabs
        pool={pool}
        userId={user.id}
        fixtures={fixtures ?? []}
        myPicks={myPicks ?? []}
        leaderboard={leaderboard ?? []}
        messages={messages}
        initialTab={tab}
      />
    </main>
  );
}
