"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NewPoolPage() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [adminHidden, setAdminHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();

  // Check admin status on mount; redirect non-admins out
  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("is_super_admin").then(({ data }) => {
      if (data === true) setIsAdmin(true);
      else {
        setIsAdmin(false);
        setTimeout(() => router.push("/pools"), 1500);
      }
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;          // prevent double-submit
    setErr(null); setBusy(true);
    const supabase = createClient();

    const { data: poolId, error } = await supabase.rpc("create_pool", {
      p_name: name.trim(),
      p_code: code.trim() || null,
      p_admin_hidden: adminHidden,
    });
    if (error) { setBusy(false); setErr(error.message); return; }

    // Try to fetch the code; if RLS or timing prevents it, fall back to /pools list.
    const { data: pool } = await supabase
      .from("pools")
      .select("code")
      .eq("id", poolId as string)
      .maybeSingle();

    if (pool?.code) {
      router.push(`/pools/${pool.code}`);
    } else {
      // Fallback: pool exists, we just can't read it back yet — go to list.
      router.push("/pools");
    }
  }

  if (isAdmin === false) {
    return (
      <main className="max-w-md mx-auto p-6 mt-12">
        <div className="card text-center">
          <div className="text-4xl mb-2">🔒</div>
          <h2 className="text-xl font-bold">Admin only</h2>
          <p className="text-sm text-[var(--muted)] mt-2">Only the platform admin can create pools. Redirecting…</p>
        </div>
      </main>
    );
  }

  if (isAdmin === null) {
    return (
      <main className="max-w-md mx-auto p-6 mt-12">
        <div className="card text-center text-[var(--muted)]">Checking access…</div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-6 mt-12">
      <h1 className="text-2xl font-bold mb-4">Create a pool</h1>
      <form onSubmit={submit} className="card flex flex-col gap-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-[var(--muted)]">Pool name</label>
          <input
            value={name} onChange={e => setName(e.target.value)} required
            placeholder="Cazares Family Cup"
            className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-lg px-3 py-2 mt-1 outline-none focus:border-[var(--crimson)]"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-[var(--muted)]">Invite code (optional)</label>
          <input
            value={code} onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="auto-generated if blank"
            className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-lg px-3 py-2 mt-1 font-mono uppercase tracking-widest outline-none focus:border-[var(--crimson)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="adminHidden"
            checked={adminHidden}
            onChange={e => setAdminHidden(e.target.checked)}
            className="w-4 h-4 rounded border border-[var(--border)] bg-[var(--bg-2)] cursor-pointer"
          />
          <label htmlFor="adminHidden" className="text-sm text-[var(--muted)] cursor-pointer select-none">
            Hide me from Members and Leaderboard
          </label>
        </div>
        {err && <div className="text-sm text-[var(--crimson)]">{err}</div>}
        <button disabled={busy || !name} className="btn btn-primary justify-center">
          {busy ? "Creating…" : "Create pool"}
        </button>
      </form>
    </main>
  );
}
