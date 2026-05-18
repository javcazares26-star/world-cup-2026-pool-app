import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JoinPoolForm } from "./_components";

export const dynamic = "force-dynamic";

export default async function PoolsListPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("pool_members")
    .select("pool:pools(id,code,name,owner_id,created_at)")
    .eq("user_id", user.id);

  const pools = (memberships ?? []).map((m: any) => m.pool).filter(Boolean);

  // Check if this user is the platform admin
  const { data: isAdminData } = await supabase.rpc("is_super_admin");
  const isAdmin = isAdminData === true;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your pools</h1>
        <form action="/auth/signout" method="post">
          <button className="btn" formAction="/auth/signout">Sign out</button>
        </form>
      </header>

      {pools.length === 0 ? (
        <div className="card text-center">
          <div className="text-5xl">🏆</div>
          <h2 className="text-xl font-bold mt-3">You're not in any pool yet</h2>
          <p className="text-[var(--muted)] text-sm mt-2">
            {isAdmin
              ? "Create your own pool, or join one with a code."
              : "Ask the pool admin to share an invite code with you, then enter it below to join."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {pools.map((p: any) => (
            <Link key={p.id} href={`/pools/${p.code}`} className="card hover:border-[var(--crimson)] transition flex justify-between items-center">
              <div>
                <div className="font-bold">{p.name}</div>
                <div className="text-xs text-[var(--muted)] font-mono mt-1">CODE: {p.code}</div>
              </div>
              <div className="text-[var(--gold)]">→</div>
            </Link>
          ))}
        </div>
      )}

      <div className={"grid gap-3 mt-8 " + (isAdmin ? "sm:grid-cols-2" : "sm:grid-cols-1")}>
        {isAdmin && (
          <Link href="/pools/new" className="btn btn-primary justify-center">
            + Create a pool <span className="text-xs opacity-70 ml-1">(admin)</span>
          </Link>
        )}
        <JoinPoolForm />
      </div>
    </main>
  );
}
